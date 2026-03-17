// @vitest-environment jsdom

import { Inbox } from "lucide-react";
import { render, screen } from "@testing-library/react";

import AdminMetricCard from "@/components/admin/AdminMetricCard";
import DashboardPageHeader from "@/components/admin/DashboardPageHeader";

describe("dashboard chrome", () => {
  it("renders the page header with a light admin hierarchy", () => {
    render(
      <DashboardPageHeader
        title="Resumen"
        description="Vista rapida del estado comercial del gimnasio."
      />,
    );

    expect(screen.getByText("Backoffice")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(
      screen.getByText("Vista rapida del estado comercial del gimnasio."),
    ).toBeInTheDocument();
  });

  it("renders metric cards with label, value and hint", () => {
    render(
      <AdminMetricCard
        label="Leads pendientes"
        value="8"
        hint="Contactos que todavia no recibieron seguimiento."
        icon={Inbox}
        tone="warning"
      />,
    );

    expect(screen.getByText("Leads pendientes")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(
      screen.getByText("Contactos que todavia no recibieron seguimiento."),
    ).toBeInTheDocument();
  });
});
