import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, getDashboardAccessState, LocalAdminUser } from "./auth";
import { createApiErrorResponse } from "./api-errors";
import { PersistedUserRole } from "./user-roles";
import { AuthUser } from "./auth-user";

function buildDashboardUnauthenticatedMessage() {
  if (process.env.NODE_ENV === "production") {
    return "No autenticado. Inicia sesion con tu cuenta del dashboard.";
  }

  return "No autenticado. Inicia sesion con Firebase o usa admin local en desarrollo.";
}

function buildDashboardForbiddenMessage() {
  return "No tienes permisos suficientes. Verifica tu rol en Supabase public.user_roles.";
}

/**
 * Parsea el body de la request de forma segura.
 */
export async function parseJsonBodySafe<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Valida el body de la request contra un schema de Zod.
 */
export async function validateBody<T>(request: Request, schema: z.Schema<T>): Promise<{ data: T } | { errorResponse: NextResponse }> {
  const body = await parseJsonBodySafe<T>(request);
  
  if (!body) {
    return { 
      errorResponse: createApiErrorResponse("El cuerpo de la solicitud no es un JSON valido.", { status: 400 }) 
    };
  }

  const result = schema.safeParse(body);
  
  if (!result.success) {
    return { 
      errorResponse: createApiErrorResponse(result.error, { status: 400 }) 
    };
  }

  return { data: result.data };
}

/**
 * Asegura que el usuario este autenticado con Firebase.
 */
export async function requireFirebaseUser(): Promise<
  { success: true; user: AuthUser } | { success: false; errorResponse: NextResponse }
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      success: false,
      errorResponse: NextResponse.json({ error: buildDashboardUnauthenticatedMessage() }, { status: 401 }),
    };
  }
  return { success: true, user };
}

/**
 * Asegura que el usuario tenga al menos uno de los roles especificados.
 */
export async function requireRoles(allowedRoles: PersistedUserRole[]): Promise<
  { success: true; user: AuthUser | LocalAdminUser; accessMode: string } | { success: false; errorResponse: NextResponse }
> {
  const accessState = await getDashboardAccessState();
  
  if (!accessState.user || !accessState.accessMode) {
    return { 
      success: false,
      errorResponse: NextResponse.json({ error: buildDashboardUnauthenticatedMessage() }, { status: 401 }) 
    };
  }

  if (allowedRoles.length > 0) {
    if (accessState.accessMode === "superadmin") {
      return { success: true, user: accessState.user, accessMode: accessState.accessMode };
    }

    if (accessState.accessMode === "local") {
      if (process.env.NODE_ENV === "production") {
        return {
          success: false,
          errorResponse: NextResponse.json(
            { error: "Sesion local no permitida en produccion." },
            { status: 403 },
          ),
        };
      }

      return { success: true, user: accessState.user, accessMode: accessState.accessMode };
    }

    const hasRole = (allowedRoles as string[]).includes(accessState.accessMode);
    if (!hasRole) {
      return { 
        success: false,
        errorResponse: NextResponse.json({ error: buildDashboardForbiddenMessage() }, { status: 403 }) 
      };
    }
  }

  return { success: true, user: accessState.user, accessMode: accessState.accessMode };
}

/**
 * Wrapper para manejar errores comunes en API routes.
 */
export async function withApiErrorHandling(
  handler: () => Promise<NextResponse | Response>,
): Promise<NextResponse> {
  try {
    const result = await handler();
    return result instanceof NextResponse ? (result as NextResponse) : new NextResponse(result.body, result);
  } catch (error) {
    return createApiErrorResponse(error, { status: 500 });
  }
}

export function unauthorized(message = buildDashboardUnauthenticatedMessage()) {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = buildDashboardForbiddenMessage()) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message = "Solicitud invalida.") {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Interfaz para un limitador de frecuencia.
 */
export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<{ success: boolean; remaining: number; reset: number }>;
}

/**
 * Limitador en memoria (volatil, util para desarrollo o despliegues de un solo nodo).
 */
class MemoryRateLimiter implements RateLimiter {
  private cache = new Map<string, { count: number; expires: number }>();

  async check(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.expires) {
      const newEntry = { count: 1, expires: now + windowMs };
      this.cache.set(key, newEntry);
      return { success: true, remaining: limit - 1, reset: newEntry.expires };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0, reset: entry.expires };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count, reset: entry.expires };
  }
}

const memoryRateLimiter = new MemoryRateLimiter();

/**
 * Aplica rate limiting a una solicitud.
 * @param key Identificador unico (ej. IP o userId)
 * @param limit Maximo de solicitudes permitidas
 * @param windowMs Ventana de tiempo en milisegundos
 */
export async function applyRateLimit(
  key: string,
  limit = 5,
  windowMs = 60000,
): Promise<{ success: true; remaining: number } | { success: false; errorResponse: NextResponse }> {
  // TODO: En produccion, si se usa un cluster, conectar con Redis aqui.
  const result = await memoryRateLimiter.check(key, limit, windowMs);
  
  if (!result.success) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Demasiadas solicitudes. Por favor, espera un momento." },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0"
          }
        }
      )
    };
  }

  return { success: true, remaining: result.remaining };
}

/**
 * Obtiene el identificador de cliente (IP) de forma segura.
 */
export function getClientIp(request: Request) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return "anonymous";
}

/**
 * Valida el origen de la solicitud para prevenir CSRF en mutaciones.
 */
export function validateRequestOrigin(
  request: Request,
): { success: true } | { success: false; errorResponse: NextResponse } {
  // Los runners y el servidor local no tienen un proxy de confianza que
  // garantice estas cabeceras. El control estricto es un gate de produccion.
  if (process.env.NODE_ENV !== "production") return { success: true };

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return { 
      success: false,
      errorResponse: NextResponse.json({ error: "Falta cabecera de origen o validacion CSRF." }, { status: 403 }) 
    };
  }

  // Comprobacion simple de que el origen coincide con el host
  try {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return { 
        success: false,
        errorResponse: NextResponse.json({ error: "Origen no permitido." }, { status: 403 }) 
      };
    }
  } catch {
    return { 
      success: false,
      errorResponse: NextResponse.json({ error: "Origen invalido." }, { status: 403 }) 
    };
  }

  return { success: true };
}
