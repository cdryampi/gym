import {
  buildCommerceMetrics,
  buildDashboardMetrics,
  countLeadsByStatus,
  getCommerceSourceMeta,
  getLeadStatusMeta,
  getTopbarStatusMeta,
} from "@/lib/admin-dashboard";
import { products as mockProducts } from "@/data/products";
import { defaultLeads } from "@/lib/data/default-content";

describe("admin dashboard helpers", () => {
  it("counts leads by status", () => {
    expect(countLeadsByStatus(defaultLeads)).toEqual({
      new: 1,
      contacted: 1,
      closed: 1,
    });
  });

  it("builds dashboard metrics for the summary cards", () => {
    const metrics = buildDashboardMetrics(defaultLeads, 1);

    expect(metrics).toHaveLength(3);
    expect(metrics[0]).toMatchObject({
      label: "Leads pendientes",
      value: "1",
      tone: "warning",
    });
    expect(metrics[2]).toMatchObject({
      label: "Seguimiento activo",
      value: "67%",
    });
  });

  it("builds commerce metrics for the admin shop summary", () => {
    const metrics = buildCommerceMetrics(mockProducts, "medusa");

    expect(metrics).toHaveLength(3);
    expect(metrics[0]).toMatchObject({
      label: "Catalogo visible",
      value: String(mockProducts.length),
    });
    expect(metrics[1]).toMatchObject({
      label: "Fuente commerce",
      value: "Medusa activa",
      tone: "success",
    });
  });

  it("maps status copy for lead, topbar and commerce badges", () => {
    expect(getLeadStatusMeta("closed")).toEqual({
      label: "Cerrado",
      tone: "success",
    });
    expect(getTopbarStatusMeta("expired")).toEqual({
      label: "Caducado",
      tone: "warning",
    });
    expect(getCommerceSourceMeta("supabase")).toEqual({
      label: "Operacion Supabase",
      tone: "warning",
      hint: "El dashboard opera taxonomy y catalogo desde Supabase mientras Medusa queda como backend commerce preparado para sincronizacion.",
    });
  });
});
