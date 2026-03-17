import { cache } from "react";

import { getCommerceProvider, hasMedusaEnv, hasSupabasePublicEnv } from "@/lib/env";

import { getMedusaCommerceProductBySlug, getMedusaCommerceProducts } from "./medusa";
import { getMockCommerceProducts } from "./mock";
import { getSupabaseCommerceProducts } from "./supabase";
import type {
  CommerceCatalogSnapshot,
  CommerceProductSnapshot,
  CommerceProvider,
  CommerceSource,
} from "./types";

type CommerceLoader = () => Promise<CommerceCatalogSnapshot>;
type CommerceProductLoader = (slug: string) => Promise<CommerceProductSnapshot>;

async function loadMockCatalog(): Promise<CommerceCatalogSnapshot> {
  return {
    products: getMockCommerceProducts(),
    source: "mock",
    warning: "La tienda usa el catalogo mock local. Medusa y Supabase no estan activos para commerce.",
  };
}

async function loadMockProduct(slug: string): Promise<CommerceProductSnapshot> {
  const product = getMockCommerceProducts().find((entry) => entry.slug === slug) ?? null;

  return {
    product,
    source: "mock",
    warning: "La tienda usa el catalogo mock local. Medusa y Supabase no estan activos para commerce.",
  };
}

async function loadSupabaseCatalog(): Promise<CommerceCatalogSnapshot> {
  const products = await getSupabaseCommerceProducts();

  return {
    products,
    source: "supabase",
    warning:
      "La tienda esta leyendo productos desde la capa operativa de Supabase. Sincroniza con Medusa cuando quieras reflejar el mismo catalogo en el storefront principal.",
  };
}

async function loadSupabaseProduct(slug: string): Promise<CommerceProductSnapshot> {
  const products = await getSupabaseCommerceProducts();

  return {
    product: products.find((entry) => entry.slug === slug) ?? null,
    source: "supabase",
    warning:
      "La tienda esta leyendo productos desde la capa operativa de Supabase. Sincroniza con Medusa cuando quieras reflejar el mismo catalogo en el storefront principal.",
  };
}

async function loadMedusaCatalog(): Promise<CommerceCatalogSnapshot> {
  return {
    products: await getMedusaCommerceProducts(),
    source: "medusa",
    warning: null,
  };
}

async function loadMedusaProduct(slug: string): Promise<CommerceProductSnapshot> {
  return {
    product: await getMedusaCommerceProductBySlug(slug),
    source: "medusa",
    warning: null,
  };
}

function getAutoCandidates(): CommerceSource[] {
  const sources: CommerceSource[] = [];

  if (hasMedusaEnv()) {
    sources.push("medusa");
  }

  if (hasSupabasePublicEnv()) {
    sources.push("supabase");
  }

  sources.push("mock");
  return sources;
}

function getCandidates(provider: CommerceProvider): CommerceSource[] {
  if (provider === "auto") {
    return getAutoCandidates();
  }

  return [provider, ...getAutoCandidates().filter((candidate) => candidate !== provider)];
}

const loaders: Record<CommerceSource, CommerceLoader> = {
  medusa: loadMedusaCatalog,
  supabase: loadSupabaseCatalog,
  mock: loadMockCatalog,
};

const productLoaders: Record<CommerceSource, CommerceProductLoader> = {
  medusa: loadMedusaProduct,
  supabase: loadSupabaseProduct,
  mock: loadMockProduct,
};

export const getCommerceCatalog = cache(async (): Promise<CommerceCatalogSnapshot> => {
  const provider = getCommerceProvider();
  const warnings: string[] = [];

  for (const source of getCandidates(provider)) {
    try {
      const snapshot = await loaders[source]();

      return {
        ...snapshot,
        warning: [snapshot.warning, ...warnings].filter(Boolean).join(" ") || null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fallo desconocido";
      warnings.push(`No se pudo cargar commerce desde ${source}: ${message}`);
    }
  }

  return {
    products: getMockCommerceProducts(),
    source: "mock",
    warning: warnings.join(" ") || "No se pudo resolver una fuente de commerce valida.",
  };
});

export const getCommerceProductBySlug = cache(
  async (slug: string): Promise<CommerceProductSnapshot> => {
    const provider = getCommerceProvider();
    const warnings: string[] = [];

    for (const source of getCandidates(provider)) {
      try {
        const snapshot = await productLoaders[source](slug);

        if (snapshot.product) {
          return {
            ...snapshot,
            warning: [snapshot.warning, ...warnings].filter(Boolean).join(" ") || null,
          };
        }

        warnings.push(`No se encontro el producto ${slug} en ${source}.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Fallo desconocido";
        warnings.push(`No se pudo cargar el producto desde ${source}: ${message}`);
      }
    }

    return {
      product: null,
      source: "mock",
      warning: warnings.join(" ") || "No se pudo resolver una fuente de commerce valida.",
    };
  },
);
