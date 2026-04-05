// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import MemberTestimonialForm from "@/components/auth/MemberTestimonialForm";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe("MemberTestimonialForm", () => {
  beforeEach(() => {
    refreshMock.mockReset();
  });

  it("updates the selected rating when the member clicks a different star", async () => {
    const user = userEvent.setup();

    render(<MemberTestimonialForm initialTestimonial={null} />);

    const threeStarsButton = screen.getByRole("button", { name: "3 estrellas" });
    const fiveStarsButton = screen.getByRole("button", { name: "5 estrellas" });

    expect(fiveStarsButton).toHaveAttribute("aria-pressed", "true");

    await user.click(threeStarsButton);

    expect(threeStarsButton).toHaveAttribute("aria-pressed", "true");
    expect(fiveStarsButton).toHaveAttribute("aria-pressed", "false");
  });
});
