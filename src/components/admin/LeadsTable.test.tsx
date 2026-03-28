// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import LeadsTable from "@/components/admin/LeadsTable";
import { defaultLeads } from "@/lib/data/default-content";

describe("LeadsTable", () => {
  it("shows the empty state when there are no leads", () => {
    render(<LeadsTable leads={[]} />);

    expect(screen.getByText("Todavia no hay leads")).toBeInTheDocument();
  });

  it("shows a filtered empty state when filters are active", () => {
    render(<LeadsTable leads={[]} hasActiveFilters />);

    expect(screen.getByText("No hay resultados para estos filtros")).toBeInTheDocument();
    expect(
      screen.getByText("Prueba con otra busqueda o limpia los filtros para volver a ver toda la bandeja."),
    ).toBeInTheDocument();
  });

  it("renders lead summaries, status controls and detail triggers", () => {
    render(<LeadsTable leads={defaultLeads} />);

    expect(screen.getByText("Nuevos")).toBeInTheDocument();
    expect(screen.getByText("Contactados")).toBeInTheDocument();
    expect(screen.getByText("Cerrados")).toBeInTheDocument();
    expect(screen.getAllByText(defaultLeads[0].name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(defaultLeads[0].email).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Ver detalle" }).length).toBeGreaterThan(0);
  });

  it("disables the status selector when the page is read only", () => {
    render(<LeadsTable leads={defaultLeads.slice(0, 1)} disabledReason="Solo lectura" />);

    for (const select of screen.getAllByLabelText("Estado del lead")) {
      expect(select).toBeDisabled();
      expect(select).toHaveAttribute("title", "Solo lectura");
    }
  });
});
