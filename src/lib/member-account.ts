import { formatShortDate } from "@/lib/utils";

interface AuthProviderLike {
  app_metadata?: {
    provider?: unknown;
  } | null;
  identities?: Array<{
    provider?: string | null;
  }> | null;
}

export interface MemberAccountQuickLink {
  href: string;
  label: string;
  description: string;
}

function normalizeProvider(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export function formatMemberAccountDate(value: string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }

  return formatShortDate(value);
}

export function getMemberAuthProviderLabel(user: AuthProviderLike) {
  const provider =
    normalizeProvider(user.app_metadata?.provider) ??
    normalizeProvider(user.identities?.[0]?.provider);

  switch (provider) {
    case "email":
    case "password":
      return "Email y contrasena";
    case "google":
      return "Google";
    case "phone":
      return "Telefono";
    default:
      return "Acceso basico";
  }
}

export function getMemberAccountQuickLinks(input: {
  hasActiveCart: boolean;
  hasPickupHistory: boolean;
}): MemberAccountQuickLink[] {
  return [
    input.hasActiveCart
      ? {
          href: "/carrito",
          label: "Retomar carrito",
          description: "Continua tu compra pickup desde el punto donde la dejaste.",
        }
      : {
          href: "/tienda",
          label: "Ir a la tienda",
          description: "Explora productos y abre un nuevo carrito pickup cuando quieras.",
        },
    {
      href: "#pedidos-pickup",
      label: input.hasPickupHistory ? "Ver pedidos pickup" : "Seguir futuros pedidos",
      description: input.hasPickupHistory
        ? "Baja al resumen de pedidos pickup asociados a tu cuenta."
        : "Cuando cierres tu primera compra, aqui veras el seguimiento privado.",
    },
    {
      href: "/horarios",
      label: "Horarios del club",
      description: "Consulta cuando pasar por el club para recoger o entrenar.",
    },
  ];
}
