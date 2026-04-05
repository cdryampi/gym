export interface MarketingPlanFeature {
  label: string;
  included: boolean;
}

export interface MarketingPlan {
  id: string;
  site_settings_id: number;
  title: string;
  description: string | null;
  price_label: string;
  billing_label: string;
  badge: string | null;
  features: MarketingPlanFeature[];
  is_featured: boolean;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingScheduleRow {
  id: string;
  site_settings_id: number;
  label: string;
  description: string | null;
  opens_at: string;
  closes_at: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MarketingTestimonialModerationStatus = "pending" | "approved" | "rejected";

export interface MarketingTestimonial {
  id: string;
  site_settings_id: number;
  member_profile_id: string;
  supabase_user_id: string;
  quote: string;
  rating: number;
  author_name: string;
  author_detail: string;
  author_initials: string;
  moderation_status: MarketingTestimonialModerationStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

const nowIso = new Date(0).toISOString();

export const defaultMarketingPlans: MarketingPlan[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    site_settings_id: 1,
    title: "Basico Forza",
    description: null,
    price_label: "S/150",
    billing_label: "/mes",
    badge: null,
    features: [
      { label: "Acceso zona pesas libre", included: true },
      { label: "Horarios limitados", included: false },
      { label: "Sin asesoria nutricional", included: false },
    ],
    is_featured: false,
    order: 0,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    site_settings_id: 1,
    title: "Elite Mensual",
    description: null,
    price_label: "S/280",
    billing_label: "/mes",
    badge: "Recomendado",
    features: [
      { label: "Acceso total 24/7", included: true },
      { label: "Evaluacion nutricional", included: true },
      { label: "1 Sesion PT mensual", included: true },
      { label: "Acceso a clases grupales", included: true },
    ],
    is_featured: true,
    order: 1,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    site_settings_id: 1,
    title: "Plan Anual Pro",
    description: null,
    price_label: "S/2500",
    billing_label: "/ano",
    badge: null,
    features: [
      { label: "Todo lo del plan Elite", included: true },
      { label: "2 Sesiones PT/mes", included: true },
      { label: "Kit Nova Forza de bienvenida", included: true },
      { label: "Invitado mensual gratuito", included: true },
    ],
    is_featured: false,
    order: 2,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
];

export const defaultMarketingScheduleRows: MarketingScheduleRow[] = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    site_settings_id: 1,
    label: "Lunes - Viernes",
    description: null,
    opens_at: "05:00 AM",
    closes_at: "11:00 PM",
    order: 0,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    site_settings_id: 1,
    label: "Sabados",
    description: null,
    opens_at: "07:00 AM",
    closes_at: "08:00 PM",
    order: 1,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    site_settings_id: 1,
    label: "Domingos y Feriados",
    description: null,
    opens_at: "08:00 AM",
    closes_at: "04:00 PM",
    order: 2,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
];

export const defaultMarketingTestimonials: MarketingTestimonial[] = [];
