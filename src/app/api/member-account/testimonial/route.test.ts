import { describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getAuthenticatedMemberTestimonial: vi.fn(),
  getCurrentMemberUser: vi.fn(),
  upsertAuthenticatedMemberTestimonial: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentMemberUser: routeMocks.getCurrentMemberUser,
}));

vi.mock("@/lib/data/member-account", () => ({
  getAuthenticatedMemberTestimonial: routeMocks.getAuthenticatedMemberTestimonial,
  upsertAuthenticatedMemberTestimonial: routeMocks.upsertAuthenticatedMemberTestimonial,
}));

describe("/api/member-account/testimonial", () => {
  it("returns the authenticated member testimonial", async () => {
    routeMocks.getCurrentMemberUser.mockResolvedValue({
      email: "member@titangym.pe",
      id: "user-1",
    });
    routeMocks.getAuthenticatedMemberTestimonial.mockResolvedValue({
      id: "testimonial-1",
      quote: "Gran ambiente para entrenar serio.",
    });

    const { GET } = await import("./route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.testimonial.id).toBe("testimonial-1");
  });

  it("creates or updates the authenticated member testimonial", async () => {
    routeMocks.getCurrentMemberUser.mockResolvedValue({
      email: "member@titangym.pe",
      id: "user-1",
    });
    routeMocks.upsertAuthenticatedMemberTestimonial.mockResolvedValue({
      mode: "updated",
      testimonial: {
        id: "testimonial-1",
        quote: "Actualice mi experiencia.",
        rating: 5,
      },
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/member-account/testimonial", {
        body: JSON.stringify({
          quote: "Actualice mi experiencia.",
          rating: 5,
        }),
        method: "PATCH",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(routeMocks.upsertAuthenticatedMemberTestimonial).toHaveBeenCalledWith({
      quote: "Actualice mi experiencia.",
      rating: 5,
    });
    expect(payload.mode).toBe("updated");
    expect(payload.message).toMatch(/volvera a revision/i);
  });
});
