// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import LeadFollowUpForm from "@/components/admin/LeadFollowUpForm";
import { defaultLeads } from "@/lib/data/default-content";

const saveLeadFollowUpMock = vi.fn();

vi.mock("@/app/(admin)/dashboard/actions", () => ({
  saveLeadFollowUp: (...args: unknown[]) => saveLeadFollowUpMock(...args),
}));

describe("LeadFollowUpForm", () => {
  beforeEach(() => {
    saveLeadFollowUpMock.mockReset();
  });

  it("loads the persisted follow-up values", () => {
    render(<LeadFollowUpForm lead={defaultLeads[1]} />);

    expect(screen.getByLabelText("Canal")).toHaveValue(defaultLeads[1].channel);
    expect(screen.getByLabelText("Resultado")).toHaveValue(defaultLeads[1].outcome);
    expect(screen.getByLabelText("Siguiente paso")).toHaveValue(defaultLeads[1].next_step);
  });

  it("sends the follow-up payload on save", async () => {
    saveLeadFollowUpMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LeadFollowUpForm lead={defaultLeads[0]} />);

    await user.clear(screen.getByLabelText("Canal"));
    await user.type(screen.getByLabelText("Canal"), "Email");
    await user.clear(screen.getByLabelText("Resultado"));
    await user.type(screen.getByLabelText("Resultado"), "Pidio brochure");
    await user.clear(screen.getByLabelText("Siguiente paso"));
    await user.type(screen.getByLabelText("Siguiente paso"), "Enviar resumen esta tarde.");
    await user.click(screen.getByRole("button", { name: "Guardar seguimiento" }));

    await waitFor(() => {
      expect(saveLeadFollowUpMock).toHaveBeenCalledWith(defaultLeads[0].id, {
        contacted_at: "",
        channel: "Email",
        outcome: "Pidio brochure",
        next_step: "Enviar resumen esta tarde.",
      });
    });
  });
});
