// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import type { MarketingTestimonial } from "@/lib/data/marketing-content";

const testimonial: MarketingTestimonial = {
  approved_at: "2026-04-04T12:00:00.000Z",
  author_detail: "Socio desde 2024",
  author_initials: "TG",
  author_name: "Titan Garcia",
  created_at: "2026-04-03T12:00:00.000Z",
  id: "testimonial-1",
  member_profile_id: "member-1",
  moderation_status: "approved",
  quote: "Entrenar aqui me devolvio la constancia y el foco.",
  rating: 4,
  site_settings_id: 1,
  supabase_user_id: "user-1",
  updated_at: "2026-04-04T12:00:00.000Z",
};

describe("TestimonialsSection", () => {
  it("does not render when there are no approved testimonials", () => {
    const { container } = render(<TestimonialsSection testimonials={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders testimonial cards from Supabase data", () => {
    render(<TestimonialsSection testimonials={[testimonial]} />);

    expect(screen.getByText(/Titan Garcia/i)).toBeInTheDocument();
    expect(screen.getByText(/Socio desde 2024/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Entrenar aqui me devolvio la constancia y el foco/i),
    ).toBeInTheDocument();
  });
});
