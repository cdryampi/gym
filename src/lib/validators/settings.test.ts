import { siteSettingsSchema } from "@/lib/validators/settings";

const validSettings = {
  site_name: "Nova Forza",
  site_tagline: "Fuerza, disciplina y progreso real.",
  hero_badge: "Gimnasio premium local",
  hero_title: "Construye fuerza real en un espacio hecho para progresar.",
  hero_description: "Una base comercial para captar leads y mantener el contenido global del gimnasio.",
  hero_primary_cta: "Reserva tu prueba",
  hero_secondary_cta: "Ver planes",
  hero_video_url: "/video/video.mp4",
  topbar_enabled: false,
  topbar_variant: "promotion",
  topbar_text: "",
  topbar_cta_label: "",
  topbar_cta_url: "",
  topbar_expires_at: "",
  hero_highlight_one: "Planes claros para empezar y progresar.",
  hero_highlight_two: "Entrenadores que acompanan de verdad.",
  hero_highlight_three: "Sala premium local con horarios amplios.",
  contact_email: "hola@novaforza.pe",
  notification_email: "pedidos@novaforza.pe",
  transactional_from_email: "pedidos@novaforza.pe",
  contact_phone: "+51 987 654 321",
  whatsapp_url: "https://wa.me/51987654321",
  address: "Av. Progreso 245, zona comercial local",
  opening_hours: "Lunes a viernes de 6:00 a 22:00.",
  seo_title: "Nova Forza | Gimnasio premium",
  seo_description: "Web comercial de Nova Forza con planes claros y contacto directo.",
  seo_keywords: "nova forza, gimnasio premium, fuerza",
  seo_og_image_url: "",
  seo_canonical_url: "https://novaforza.pe",
  footer_text: "Nova Forza es un gimnasio local orientado a fuerza y progreso real.",
};

describe("siteSettingsSchema", () => {
  it("accepts a valid settings payload", () => {
    const result = siteSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("rejects invalid contact email", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      contact_email: "hola-at-novaforza.pe",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid notification email", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      notification_email: "pedidos-at-novaforza.pe",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a transactional sender outside the allowed domain", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      transactional_from_email: "novaforza@gmail.com",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid local hero video path", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      hero_video_url: "video.mp4",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an active topbar with a valid deadline", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      topbar_enabled: true,
      topbar_text: "Matricula gratis por tiempo limitado.",
      topbar_cta_label: "Reserva",
      topbar_cta_url: "#contacto",
      topbar_expires_at: "2026-04-15T18:30",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an active topbar without text", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      topbar_enabled: true,
      topbar_text: "",
      topbar_expires_at: "2026-04-15T18:30",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an active topbar without deadline", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      topbar_enabled: true,
      topbar_text: "Promo activa",
      topbar_expires_at: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid topbar cta url", () => {
    const result = siteSettingsSchema.safeParse({
      ...validSettings,
      topbar_cta_url: "contacto",
    });

    expect(result.success).toBe(false);
  });
});
