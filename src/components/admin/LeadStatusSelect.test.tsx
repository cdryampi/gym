// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import LeadStatusSelect from "@/components/admin/LeadStatusSelect";

const updateLeadStatusMock = vi.fn();

vi.mock("@/app/(admin)/dashboard/actions", () => ({
  updateLeadStatus: (...args: unknown[]) => updateLeadStatusMock(...args),
}));

describe("LeadStatusSelect", () => {
  beforeEach(() => {
    updateLeadStatusMock.mockReset();
  });

  it("disables the control when the page is read only", () => {
    render(
      <LeadStatusSelect
        leadId="lead-1"
        currentStatus="new"
        disabledReason="Solo lectura"
      />,
    );

    expect(screen.getByLabelText("Estado del lead")).toBeDisabled();
    expect(screen.getAllByText("Nuevo").length).toBeGreaterThan(0);
  });

  it("sends the selected status change", async () => {
    updateLeadStatusMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LeadStatusSelect leadId="lead-1" currentStatus="new" />);

    await user.selectOptions(screen.getByLabelText("Estado del lead"), "closed");

    await waitFor(() => {
      expect(updateLeadStatusMock).toHaveBeenCalledWith("lead-1", "closed");
    });
  });

  it("shows an error message when the update fails", async () => {
    updateLeadStatusMock.mockRejectedValue(new Error("No se pudo guardar"));
    const user = userEvent.setup();

    render(<LeadStatusSelect leadId="lead-1" currentStatus="new" />);

    await user.selectOptions(screen.getByLabelText("Estado del lead"), "contacted");

    expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument();
  });
});
