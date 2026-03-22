// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { vi } from "vitest";

import RegistrationSuccessCard from "@/components/auth/RegistrationSuccessCard";

const replaceMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams("email=socio@gym.com"),
}));

describe("RegistrationSuccessCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replaceMock.mockReset();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it("shows the success state and redirects to home after a few seconds", () => {
    render(<RegistrationSuccessCard email="socio@gym.com" />);

    expect(screen.getByText("Cuenta creada con exito")).toBeInTheDocument();
    expect(screen.getByText("socio@gym.com")).toBeInTheDocument();
    expect(screen.getByText(/Te llevaremos automaticamente a la home/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(replaceMock).toHaveBeenCalledWith("/");
  });
});
