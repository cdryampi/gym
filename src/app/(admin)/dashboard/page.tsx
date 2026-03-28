import {
  BarChart3,
  Building2,
  Inbox,
  Megaphone,
  Package,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import AdminSection from "@/components/admin/AdminSection";
import AdminSurface from "@/components/admin/AdminSurface";
import DashboardNotice from "@/components/admin/DashboardNotice";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import {
  buildCommerceMetrics,
  buildDashboardMetrics,
  countLeadsByStatus,
  getCommerceSourceMeta,
  getTopbarStatusMeta,
} from "@/lib/admin-dashboard";
import { getOrderedTrainingZones } from "@/data/training-zones";
import { plannedModules } from "@/lib/data/default-content";
import { novaForzaHomeContent } from "@/lib/data/nova-forza-content";
import { getDashboardData } from "@/lib/data/site";
import { getStoreAdminSnapshot } from "@/lib/data/store-admin";
import { resolveTopbarStatus } from "@/lib/topbar";

export default async function DashboardPage() {
  const [{ leads, settings, warning }, storeSnapshot] = await Promise.all([
    getDashboardData(),
    getStoreAdminSnapshot(),
  ]);

  const leadSummary = countLeadsByStatus(leads);
  const newLeads = leadSummary.new;
  const topbarMeta = getTopbarStatusMeta(resolveTopbarStatus(settings));
  const leadMetrics = buildDashboardMetrics(leads, newLeads);
  const commerceMetrics = buildCommerceMetrics(storeSnapshot.products, storeSnapshot.source, {
    warning: storeSnapshot.warning,
  });
  const commerceMeta = getCommerceSourceMeta(storeSnapshot.source, {
    warning: storeSnapshot.warning,
  });
  const inventory = [
    { label: "Zonas activas", value: String(getOrderedTrainingZones().length), icon: ShieldCheck },
    { label: "Productos visibles", value: String(storeSnapshot.products.length), icon: ShoppingBag },
    {
      label: "Recogida local",
      value: String(storeSnapshot.products.filter((product) => product.pickup_only).length),
      icon: Package,
    },
    {
      label: "Productos destacados",
      value: String(storeSnapshot.products.filter((product) => product.featured).length),
      icon: Building2,
    },
    { label: "Equipo visible", value: String(novaForzaHomeContent.team.length), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Resumen"
        description="Vista rapida del estado comercial y operativo del sitio publico, los leads y la tienda activa."
        icon={BarChart3}
        eyebrow="Vision general"
      />

      {warning ? <DashboardNotice message={warning} /> : null}
      {storeSnapshot.warning ? <DashboardNotice message={storeSnapshot.warning} /> : null}

      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-[#d71920]/10 bg-[#fff5f5] text-[#d71920]">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Prioridad operativa
            </p>
            <p className="mt-1 text-sm text-[#5f6368]">Lo urgente para atender hoy.</p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {leadMetrics.map((metric) => (
            <AdminMetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-black/8 bg-[#f4f1ea] text-[#5f6368]">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
              Salud comercial
            </p>
            <p className="mt-1 text-sm text-[#5f6368]">Indicadores del catalogo y flujo de tienda.</p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {commerceMetrics.map((metric) => (
            <AdminMetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminSection
          title="Estado comercial"
          description="Lo esencial para saber si la captacion, la identidad publica y la tienda estan alineadas."
          badge={<Badge variant={topbarMeta.tone}>{topbarMeta.label}</Badge>}
          icon={Megaphone}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <AdminSurface inset className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#fff5f5] text-[#d71920]">
                  <Inbox className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Embudo de leads</p>
                  <p className="mt-1 text-sm text-[#5f6368]">
                    {leadSummary.contacted + leadSummary.closed} de {leads.length} ya avanzaron de fase.
                  </p>
                </div>
              </div>
            </AdminSurface>
            <AdminSurface inset className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#fff5f5] text-[#d71920]">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Topbar promocional</p>
                  <p className="mt-1 text-sm text-[#5f6368]">
                    {settings.topbar_text ?? "Sin promo cargada por ahora."}
                  </p>
                </div>
              </div>
            </AdminSurface>
            <AdminSurface inset className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                Identidad activa
              </p>
              <p className="mt-2 text-lg font-semibold text-[#111111]">{settings.site_name}</p>
              <p className="mt-2 text-sm leading-6 text-[#5f6368]">{settings.site_tagline}</p>
            </AdminSurface>
            <AdminSurface inset className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
                Fuente de tienda
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={commerceMeta.tone}>{commerceMeta.label}</Badge>
                <p className="text-sm text-[#5f6368]">{commerceMeta.hint}</p>
              </div>
            </AdminSurface>
          </div>
        </AdminSection>

        <AdminSection
          title="Inventario publico"
          description="Conteo rapido del contenido visible hoy entre web comercial y catalogo."
          icon={ShoppingBag}
        >
          <div className="grid gap-3">
            {inventory.map((item) => {
              const Icon = item.icon;

              return (
                <AdminSurface key={item.label} inset className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#f2efe8] text-[#5f6368]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{item.label}</p>
                    <p className="mt-1 text-sm text-[#5f6368]">{item.value}</p>
                  </div>
                </AdminSurface>
              );
            })}
          </div>
        </AdminSection>
      </div>

      <AdminSection
        title="Modulos previstos"
        description="Ruta de crecimiento documentada sin adelantar complejidad en el MVP."
        icon={ShieldCheck}
      >
        <div className="flex flex-wrap gap-2">
          {plannedModules.map((module) => (
            <Badge key={module} variant="muted">
              {module}
            </Badge>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}
