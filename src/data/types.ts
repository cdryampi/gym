export interface Plan {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  price: number;
  currency: string;
  billing_period: 'mensual' | 'anual' | 'trimestral';
  features: string[];
  highlighted: boolean;
  order: number;
  active: boolean;
}

export interface Schedule {
  day: string;
  opens_at: string;
  closes_at: string;
  notes?: string;
}

export interface Trainer {
  id: string;
  slug: string;
  name: string;
  role: string;
  specialty: string;
  short_bio: string;
  image: string;
  social_instagram?: string;
  order: number;
  active: boolean;
}

export const productCategories = ["suplementos", "accesorios", "merchandising"] as const;
export type ProductCategory = (typeof productCategories)[number];

export const productStockStatuses = [
  "in_stock",
  "low_stock",
  "out_of_stock",
  "coming_soon",
] as const;
export type ProductStockStatus = (typeof productStockStatuses)[number];

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
}

export interface ProductVariantOptionValue {
  option_id?: string;
  option_title?: string;
  value: string;
}

export interface ProductVariantPreview {
  id: string;
  title: string;
  sku?: string;
  inventory_quantity?: number | null;
  price?: number | null;
  currency?: string | null;
  options: ProductVariantOptionValue[];
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  eyebrow?: string;
  category: ProductCategory;
  short_description: string;
  description: string;
  price: number;
  compare_price?: number | null;
  discount_label?: string;
  currency: string;
  stock_status: ProductStockStatus;
  pickup_only: boolean;
  pickup_note?: string;
  pickup_summary?: string;
  pickup_eta?: string;
  featured: boolean;
  images: string[];
  tags: string[];
  highlights: string[];
  benefits?: string[];
  usage_steps?: string[];
  specifications?: ProductSpecification[];
  options?: ProductOption[];
  variants?: ProductVariantPreview[];
  cta_label: string;
  order: number;
  active: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  age_range?: string;
  goal: string;
  quote: string;
  result_summary: string;
  image?: string;
  order: number;
  active: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  cta_primary: { label: string; href: string };
  cta_secondary?: { label: string; href: string };
  image: string;
  alignment: 'left' | 'center' | 'right';
  active: boolean;
}

export interface ValueProp {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}
