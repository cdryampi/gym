export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          metadata: Json;
          name: string;
          phone: string | null;
          source: string;
          status: Database["public"]["Enums"]["lead_status"];
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          metadata?: Json;
          name: string;
          phone?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["lead_status"];
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          metadata?: Json;
          name?: string;
          phone?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["lead_status"];
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          address: string | null;
          contact_email: string;
          contact_phone: string | null;
          footer_text: string;
          hero_badge: string;
          hero_description: string;
          hero_highlight_one: string;
          hero_highlight_three: string;
          hero_highlight_two: string;
          hero_primary_cta: string;
          hero_secondary_cta: string;
          hero_title: string;
          hero_video_url: string | null;
          id: number;
          opening_hours: string | null;
          topbar_cta_label: string | null;
          topbar_cta_url: string | null;
          topbar_enabled: boolean;
          topbar_expires_at: string | null;
          topbar_text: string | null;
          topbar_variant: string;
          seo_canonical_url: string | null;
          seo_description: string;
          seo_keywords: string[];
          seo_og_image_url: string | null;
          seo_title: string;
          site_name: string;
          site_tagline: string;
          updated_at: string;
          whatsapp_url: string | null;
        };
        Insert: {
          address?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          footer_text: string;
          hero_badge: string;
          hero_description: string;
          hero_highlight_one: string;
          hero_highlight_three: string;
          hero_highlight_two: string;
          hero_primary_cta: string;
          hero_secondary_cta: string;
          hero_title: string;
          hero_video_url?: string | null;
          id?: number;
          opening_hours?: string | null;
          topbar_cta_label?: string | null;
          topbar_cta_url?: string | null;
          topbar_enabled?: boolean;
          topbar_expires_at?: string | null;
          topbar_text?: string | null;
          topbar_variant?: string;
          seo_canonical_url?: string | null;
          seo_description: string;
          seo_keywords: string[];
          seo_og_image_url?: string | null;
          seo_title: string;
          site_name: string;
          site_tagline: string;
          updated_at?: string;
          whatsapp_url?: string | null;
        };
        Update: {
          address?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          footer_text?: string;
          hero_badge?: string;
          hero_description?: string;
          hero_highlight_one?: string;
          hero_highlight_three?: string;
          hero_highlight_two?: string;
          hero_primary_cta?: string;
          hero_secondary_cta?: string;
          hero_title?: string;
          hero_video_url?: string | null;
          id?: number;
          opening_hours?: string | null;
          topbar_cta_label?: string | null;
          topbar_cta_url?: string | null;
          topbar_enabled?: boolean;
          topbar_expires_at?: string | null;
          topbar_text?: string | null;
          topbar_variant?: string;
          seo_canonical_url?: string | null;
          seo_description?: string;
          seo_keywords?: string[];
          seo_og_image_url?: string | null;
          seo_title?: string;
          site_name?: string;
          site_tagline?: string;
          updated_at?: string;
          whatsapp_url?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          active: boolean;
          benefits: string[];
          category: Database["public"]["Enums"]["product_category"];
          category_id: string | null;
          compare_price: number | null;
          created_at: string;
          cta_label: string;
          currency: string;
          discount_label: string | null;
          description: string;
          eyebrow: string | null;
          featured: boolean;
          highlights: string[];
          id: string;
          images: string[];
          medusa_product_id: string | null;
          name: string;
          order: number;
          pickup_note: string | null;
          pickup_eta: string | null;
          pickup_only: boolean;
          pickup_summary: string | null;
          price: number;
          short_description: string;
          slug: string;
          specifications: Json;
          stock_status: Database["public"]["Enums"]["product_stock_status"];
          tags: string[];
          usage_steps: string[];
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          benefits?: string[];
          category: Database["public"]["Enums"]["product_category"];
          category_id?: string | null;
          compare_price?: number | null;
          created_at?: string;
          cta_label?: string;
          currency?: string;
          discount_label?: string | null;
          description: string;
          eyebrow?: string | null;
          featured?: boolean;
          highlights?: string[];
          id?: string;
          images?: string[];
          medusa_product_id?: string | null;
          name: string;
          order?: number;
          pickup_note?: string | null;
          pickup_eta?: string | null;
          pickup_only?: boolean;
          pickup_summary?: string | null;
          price: number;
          short_description: string;
          slug: string;
          specifications?: Json;
          stock_status?: Database["public"]["Enums"]["product_stock_status"];
          tags?: string[];
          usage_steps?: string[];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          benefits?: string[];
          category?: Database["public"]["Enums"]["product_category"];
          category_id?: string | null;
          compare_price?: number | null;
          created_at?: string;
          cta_label?: string;
          currency?: string;
          discount_label?: string | null;
          description?: string;
          eyebrow?: string | null;
          featured?: boolean;
          highlights?: string[];
          id?: string;
          images?: string[];
          medusa_product_id?: string | null;
          name?: string;
          order?: number;
          pickup_note?: string | null;
          pickup_eta?: string | null;
          pickup_only?: boolean;
          pickup_summary?: string | null;
          price?: number;
          short_description?: string;
          slug?: string;
          specifications?: Json;
          stock_status?: Database["public"]["Enums"]["product_stock_status"];
          tags?: string[];
          usage_steps?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      store_categories: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          medusa_category_id: string | null;
          name: string;
          order: number;
          parent_id: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          medusa_category_id?: string | null;
          name: string;
          order?: number;
          parent_id?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          medusa_category_id?: string | null;
          name?: string;
          order?: number;
          parent_id?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      lead_status: "new" | "contacted" | "closed";
      product_category: "suplementos" | "accesorios" | "merchandising";
      product_stock_status: "in_stock" | "low_stock" | "out_of_stock" | "coming_soon";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
export type DBProduct = Database["public"]["Tables"]["products"]["Row"];
export type DBStoreCategory = Database["public"]["Tables"]["store_categories"]["Row"];
export type DBProductCategory = Database["public"]["Enums"]["product_category"];
export type DBProductStockStatus = Database["public"]["Enums"]["product_stock_status"];
