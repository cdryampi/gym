"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  hasSupabasePublicEnv,
  hasSupabaseSecretKey,
  hasFirebasePublicEnv,
  hasFirebaseAdminEnv,
  hasMedusaEnv,
  hasMedusaAdminEnv,
  hasSmtpEnv,
  hasPayPalEnv,
  getPayPalEnv,
} from "@/lib/env";
import { requireSuperadminUser } from "@/lib/auth";

export type DiagnosticResult = {
  success: boolean;
  message: string;
  timestamp: string;
};

const SupabaseHealthSchema = z.object({
  count: z.number().nullable(),
});

const MedusaProductSchema = z.object({
  id: z.string(),
});

const MedusaListSchema = z.object({
  products: z.array(MedusaProductSchema),
});

export async function checkSupabaseConnection(): Promise<DiagnosticResult> {
  await requireSuperadminUser();
  
  if (!hasSupabaseSecretKey()) {
    return {
      success: false,
      message: "Falta SUPABASE_SECRET_KEY.",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase.from("user_roles").select("count", { count: "exact", head: true });
    
    if (error) throw error;

    // Validación de schema
    SupabaseHealthSchema.parse({ count });

    return {
      success: true,
      message: "Conexión con Supabase establecida y schema verificado.",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al conectar con Supabase o schema inválido: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkFirebaseAdmin(): Promise<DiagnosticResult> {
  await requireSuperadminUser();

  if (!hasFirebaseAdminEnv()) {
    return {
      success: false,
      message: "Faltan variables de Firebase Admin (Project ID, Client Email o Private Key).",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // Importación dinámica para evitar cargar firebase-admin en cliente (aunque sea "use server")
    const { getFirebaseAdminAuth } = await import("@/lib/firebase/server");
    const auth = getFirebaseAdminAuth();
    
    if (!auth) throw new Error("No se pudo inicializar Firebase Admin Auth.");

    return {
      success: true,
      message: "Firebase Admin inicializado correctamente.",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: `Error en Firebase Admin: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkMedusaStorefront(): Promise<DiagnosticResult> {
  await requireSuperadminUser();

  if (!hasMedusaEnv()) {
    return {
      success: false,
      message: "Faltan variables de Medusa Storefront (Backend URL o Publishable Key).",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { getMedusaSdk } = await import("@/lib/medusa/sdk");
    const sdk = getMedusaSdk();
    const response = await sdk.store.product.list();
    
    if (!response) throw new Error("No se recibió respuesta de Medusa Storefront.");

    // Validación estricta del schema de Medusa
    MedusaListSchema.parse(response);

    return {
      success: true,
      message: `Conexión con Medusa Storefront OK. Schema validado (${response.products?.length ?? 0} productos).`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: `Error en Medusa Storefront o schema inválido: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function checkMedusaAdmin(): Promise<DiagnosticResult> {
  await requireSuperadminUser();

  if (!hasMedusaAdminEnv()) {
    return {
      success: false,
      message: "Faltan variables de Medusa Admin (Backend URL o Admin API Key).",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const { getMedusaAdminSdk } = await import("@/lib/medusa/admin-sdk");
    const adminSdk = getMedusaAdminSdk();
    const response = await adminSdk.admin.product.list();

    // Validación estricta del schema de Medusa
    MedusaListSchema.parse(response);

    return {
      success: true,
      message: `Conexión con Medusa Admin OK. Schema validado (${response.products?.length ?? 0} productos).`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: `Error en Medusa Admin o schema inválido: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getServicesStatus() {
  await requireSuperadminUser();

  return {
    supabase: {
      configured: hasSupabasePublicEnv(),
      serviceRole: hasSupabaseSecretKey(),
    },
    firebase: {
      public: hasFirebasePublicEnv(),
      admin: hasFirebaseAdminEnv(),
    },
    medusa: {
      storefront: hasMedusaEnv(),
      admin: hasMedusaAdminEnv(),
    },
    smtp: {
      configured: hasSmtpEnv(),
    },
    paypal: {
      configured: hasPayPalEnv(),
      environment: hasPayPalEnv() ? getPayPalEnv().environment : null,
    },
  };
}
