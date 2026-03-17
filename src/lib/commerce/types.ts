import type { Product } from "@/data/types";

export type CommerceSource = "medusa" | "supabase" | "mock";
export type CommerceProvider = "auto" | CommerceSource;

export interface CommerceCatalogSnapshot {
  products: Product[];
  source: CommerceSource;
  warning: string | null;
}

export interface CommerceProductSnapshot {
  product: Product | null;
  source: CommerceSource;
  warning: string | null;
}
