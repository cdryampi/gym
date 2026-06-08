// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MembersTable from "@/components/admin/MembersTable";

const tableMocks = vi.hoisted(() => ({
  deleteMemberAction: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => tableMocks.toastError(...args),
    success: (...args: unknown[]) => tableMocks.toastSuccess(...args),
  },
}));

vi.mock("@/app/(admin)/dashboard/miembros/actions", () => ({
  deleteMemberAction: (...args: unknown[]) => tableMocks.deleteMemberAction(...args),
}));

vi.mock("@/features/admin/components/shared/delete-confirm-dialog", () => ({
  DeleteConfirmDialog: ({
    description,
    isOpen,
    onConfirm,
  }: {
    description: string;
    isOpen: boolean;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div>
        <p>{description}</p>
        <button type="button" onClick={onConfirm}>
          Confirmar borrado
        </button>
      </div>
    ) : null,
}));

const members = [
  {
    id: "member-1",
    activeRoutineId: null,
    branchName: "Centro",
    currentRoutineTitle: null,
    email: "socio@test.com",
    fullName: "Socio Titan",
    joinDate: "2026-04-01",
    linkedUserEmail: null,
    linkedUserId: null,
    memberNumber: "NF-001",
    nextActionLabel: "Asignar rutina",
    phone: null,
    planLabel: "Plan Pro",
    externalCode: null,
    birthDate: null,
    gender: null,
    address: null,
    districtOrUrbanization: null,
    occupation: null,
    preferredSchedule: null,
    legacyNotes: null,
    profileCompleted: false,
    status: "active" as const,
    trainerName: null,
    trainerUserId: null,
    updatedAt: "2026-04-22T12:00:00.000Z",
  },
];

describe("MembersTable", () => {
  beforeEach(() => {
    tableMocks.deleteMemberAction.mockReset();
    tableMocks.toastError.mockReset();
    tableMocks.toastSuccess.mockReset();
  });

  it("opens delete confirmation and removes member optimistically on confirm", async () => {
    tableMocks.deleteMemberAction.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<MembersTable initialMembers={members} />);

    await user.click(screen.getByRole("button", { name: /Eliminar socio Socio Titan/i }));
    expect(screen.getByText(/eliminara la ficha de Socio Titan/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirmar borrado/i }));

    await waitFor(() => {
      expect(tableMocks.deleteMemberAction).toHaveBeenCalledWith("member-1");
    });
    await waitFor(() => {
      expect(tableMocks.toastSuccess).toHaveBeenCalled();
    });
  });

  it("surfaces structured action failures through toast", async () => {
    tableMocks.deleteMemberAction.mockResolvedValue({
      success: false,
      error: "No se pudo eliminar",
    });
    const user = userEvent.setup();

    render(<MembersTable initialMembers={members} />);

    await user.click(screen.getByRole("button", { name: /Eliminar socio Socio Titan/i }));
    await user.click(screen.getByRole("button", { name: /Confirmar borrado/i }));

    await waitFor(() => {
      expect(tableMocks.toastError).toHaveBeenCalledWith("No se pudo eliminar");
    });
    expect(tableMocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("surfaces thrown action errors through toast", async () => {
    tableMocks.deleteMemberAction.mockRejectedValue(new Error("No se pudo eliminar"));
    const user = userEvent.setup();

    render(<MembersTable initialMembers={members} />);

    await user.click(screen.getByRole("button", { name: /Eliminar socio Socio Titan/i }));
    await user.click(screen.getByRole("button", { name: /Confirmar borrado/i }));

    await waitFor(() => {
      expect(tableMocks.toastError).toHaveBeenCalledWith("No se pudo eliminar");
    });
  });
});
