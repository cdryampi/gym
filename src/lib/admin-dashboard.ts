import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock3, Database, MessageSquareMore, Package, Store } from "lucide-react";

import type { Product } from "@/data/types";
import type { CommerceSource } from "@/lib/commerce/types";
import type { Lead, LeadStatus } from "@/lib/supabase/database.types";

export interface LeadStatusMeta {
  label: string;
  tone: "default" | "muted" | "success" | "warning";
}

type TopbarStatus = "active" | "expired" | "inactive";

export function countLeadsByStatus(leads: Lead[]) {
  return leads.reduce(
    (summary, lead) => {
      summary[lead.status] += 1;
      return summary;
    },
    { new: 0, contacted: 0, closed: 0 } as Record<LeadStatus, number>,
  );
}

export function getLeadStatusMeta(status: LeadStatus): LeadStatusMeta {
  switch (status) {
    case "contacted":
      return { label: "Contactado", tone: "muted" };
    case "closed":
      return { label: "Cerrado", tone: "success" };
    case "new":
    default:
      return { label: "Nuevo", tone: "warning" };
  }
}

export function getTopbarStatusMeta(status: TopbarStatus): LeadStatusMeta {
  switch (status) {
    case "active":
      return { label: "Activo", tone: "success" };
    case "expired":
      return { label: "Caducado", tone: "warning" };
    case "inactive":
    default:
      return { label: "Inactivo", tone: "muted" };
  }
}

export interface DashboardMetricItem {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "default" | "muted" | "success" | "warning";
}

export interface CommerceSourceMeta {
  label: string;
  tone: "default" | "muted" | "success" | "warning";
  hint: string;
}

export function buildDashboardMetrics(leads: Lead[], unreadLeads: number): DashboardMetricItem[] {
  const leadSummary = countLeadsByStatus(leads);
  const contactedRatio = leads.length
    ? `${Math.round(((leadSummary.contacted + leadSummary.closed) / leads.length) * 100)}%`
    : "0%";

  return [
    {
      label: "Leads pendientes",
      value: String(unreadLeads),
      hint: unreadLeads ? "Contactos nuevos esperando seguimiento." : "Bandeja al dia por ahora.",
      icon: Clock3,
      tone: unreadLeads ? "warning" : "success",
    },
    {
      label: "Total captado",
      value: String(leads.length),
      hint: `${leadSummary.closed} cerrados y ${leadSummary.contacted} ya contactados.`,
      icon: MessageSquareMore,
    },
    {
      label: "Seguimiento activo",
      value: contactedRatio,
      hint: "Porcentaje de leads que ya salieron del estado inicial.",
      icon: CheckCircle2,
      tone: leads.length ? "default" : "muted",
    },
  ];
}

export function getCommerceSourceMeta(source: CommerceSource): CommerceSourceMeta {
  switch (source) {
    case "medusa":
      return {
        label: "Medusa activa",
        tone: "success",
        hint: "La tienda publica ya consume catalogo real desde la Store API.",
      };
    case "supabase":
      return {
        label: "Operacion Supabase",
        tone: "warning",
        hint: "El dashboard opera taxonomy y catalogo desde Supabase mientras Medusa queda como backend commerce preparado para sincronizacion.",
      };
    case "mock":
    default:
      return {
        label: "Mock local",
        tone: "muted",
        hint: "Solo para desarrollo o contingencia. Conviene volver a Medusa cuanto antes.",
      };
  }
}

export function buildCommerceMetrics(
  products: Product[],
  source: CommerceSource,
): DashboardMetricItem[] {
  const featuredCount = products.filter((product) => product.featured).length;
  const pickupCount = products.filter((product) => product.pickup_only).length;
  const reviewCount = products.filter(
    (product) =>
      product.stock_status === "coming_soon" || product.stock_status === "out_of_stock",
  ).length;
  const sourceMeta = getCommerceSourceMeta(source);

  return [
    {
      label: "Catalogo visible",
      value: String(products.length),
      hint: `${featuredCount} destacados y ${pickupCount} orientados a recogida local.`,
      icon: Package,
      tone: products.length > 0 ? "default" : "muted",
    },
    {
      label: "Fuente commerce",
      value: sourceMeta.label,
      hint: sourceMeta.hint,
      icon: Database,
      tone: sourceMeta.tone,
    },
    {
      label: "Revision operativa",
      value: String(reviewCount),
      hint: reviewCount
        ? "Productos sin stock o en proxima reposicion que conviene revisar."
        : "Catalogo estable por ahora, sin incidencias de disponibilidad.",
      icon: Store,
      tone: reviewCount ? "warning" : "success",
    },
  ];
}
