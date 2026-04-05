import {
  buildCmsDocumentPayload,
  buildLeadFollowUpPayload,
  buildLeadInsertPayload,
  buildSiteSettingsPayload,
  normalizeCmsDocuments,
  normalizeSiteSettings,
} from "@/lib/supabase/queries";

describe("supabase queries normalizers", () => {
  it("normalizes site settings with fallback values", () => {
    const settings = normalizeSiteSettings({
      site_name: "  ",
      site_tagline: "Tagline de prueba",
      hero_badge: "Gimnasio premium local",
      hero_title: "Construye fuerza real",
      hero_description: "Descripcion util para validar la normalizacion.",
      hero_primary_cta: "CTA principal",
      hero_secondary_cta: "CTA secundario",
      hero_video_url: " /video/custom-hero.mp4 ",
      topbar_enabled: true,
      topbar_variant: "promotion",
      topbar_text: " Promo activa ",
      topbar_cta_label: " Reservar ",
      topbar_cta_url: " #contacto ",
      topbar_expires_at: " 2026-04-15T18:30:00.000Z ",
      hero_highlight_one: "Highlight uno",
      hero_highlight_two: "Highlight dos",
      hero_highlight_three: "Highlight tres",
      contact_email: "hola@novaforza.pe",
      notification_email: "pedidos@novaforza.pe",
      transactional_from_email: "pedidos@novaforza.pe",
      opening_hours: "Horario de prueba",
      seo_title: "SEO title",
      seo_description: "Descripcion suficientemente larga para pasar.",
      seo_keywords: [],
      footer_text: "Footer",
    });

    expect(settings.site_name).toBe("Titan Gym");
    expect(settings.hero_title).toBe("Construye fuerza real");
    expect(settings.hero_video_url).toBe("/video/custom-hero.mp4");
    expect(settings.topbar_text).toBe("Promo activa");
    expect(settings.notification_email).toBe("pedidos@novaforza.pe");
    expect(settings.transactional_from_email).toBe("pedidos@novaforza.pe");
  });

  it("builds a lead payload for website intake", () => {
    const payload = buildLeadInsertPayload({
      name: " Laura ",
      email: "LAURA@example.com ",
      phone: " +34 600 111 222 ",
      message: "Quiero informacion sobre planes y horarios.",
    });

    expect(payload.email).toBe("laura@example.com");
    expect(payload.phone).toBe("+34 600 111 222");
    expect(payload.source).toBe("website");
  });

  it("builds a lead follow-up payload trimming optional fields", () => {
    const payload = buildLeadFollowUpPayload({
      contacted_at: "2026-03-29T18:45",
      channel: " WhatsApp ",
      outcome: " Pidio precios ",
      next_step: " Enviar comparativa manana ",
    });

    expect(payload.contacted_at).toBe(new Date("2026-03-29T18:45").toISOString());
    expect(payload.channel).toBe("WhatsApp");
    expect(payload.outcome).toBe("Pidio precios");
    expect(payload.next_step).toBe("Enviar comparativa manana");
  });

  it("builds a site settings payload with parsed keywords", () => {
    const payload = buildSiteSettingsPayload({
      site_name: "Nova Forza",
      site_tagline: "Fuerza, disciplina y progreso real.",
      hero_badge: "Gimnasio premium local",
      hero_title: "Construye fuerza real en un espacio hecho para progresar.",
      hero_description: "Una base comercial para captar leads y mantener el contenido global del gimnasio.",
      hero_primary_cta: "Reserva tu prueba",
      hero_secondary_cta: "Ver planes",
      hero_video_url: "/video/video.mp4",
      topbar_enabled: true,
      topbar_variant: "promotion",
      topbar_text: "Matricula gratis por tiempo limitado.",
      topbar_cta_label: "Reserva tu prueba",
      topbar_cta_url: "#contacto",
      topbar_expires_at: "2026-04-15T18:30",
      hero_highlight_one: "Planes claros para empezar y progresar.",
      hero_highlight_two: "Entrenadores que acompanan de verdad.",
      hero_highlight_three: "Sala premium local con horarios amplios.",
      contact_email: "hola@novaforza.pe",
      notification_email: "pedidos@novaforza.pe",
      transactional_from_email: "pedidos@novaforza.pe",
      contact_phone: "+51 987 654 321",
      whatsapp_url: "",
      address: "Av. Progreso 245, zona comercial local",
      opening_hours: "Lunes a viernes de 6:00 a 22:00.",
      seo_title: "Nova Forza | Gimnasio premium",
      seo_description: "Web comercial de Nova Forza con planes claros y contacto directo.",
      seo_keywords: "nova forza, gimnasio premium, fuerza",
      seo_og_image_url: "",
      seo_canonical_url: "https://novaforza.pe",
      footer_text: "Nova Forza es un gimnasio local orientado a fuerza y progreso real.",
    });

    expect(payload.seo_keywords).toEqual(["nova forza", "gimnasio premium", "fuerza"]);
    expect(payload.id).toBe(1);
    expect(payload.hero_video_url).toBe("/video/video.mp4");
    expect(payload.topbar_expires_at).toBe(new Date("2026-04-15T18:30").toISOString());
    expect(payload.notification_email).toBe("pedidos@novaforza.pe");
    expect(payload.transactional_from_email).toBe("pedidos@novaforza.pe");
  });

  it("normalizes CMS documents and fills missing defaults", () => {
    const documents = normalizeCmsDocuments([
      {
        key: "legal-privacy",
        title: "Privacidad custom",
        slug: "privacidad",
      },
    ]);

    expect(documents).toHaveLength(10);
    expect(documents.find((document) => document.key === "legal-privacy")?.title).toBe(
      "Privacidad custom",
    );
    expect(documents.find((document) => document.key === "system-error-access")?.slug).toBe(
      "error-acceso",
    );
  });

  it("builds a CMS payload trimming optional fields", () => {
    const payload = buildCmsDocumentPayload({
      key: "system-cookie-banner",
      kind: "system",
      slug: "banner-cookies",
      title: " Banner ",
      summary: " Resumen operativo ",
      body_markdown: " Texto del banner ",
      cta_label: " ",
      cta_href: "",
      seo_title: " SEO title ",
      seo_description: " SEO description ",
      is_published: true,
    });

    expect(payload.title).toBe("Banner");
    expect(payload.cta_label).toBeNull();
    expect(payload.cta_href).toBeNull();
    expect(payload.seo_title).toBe("SEO title");
  });
});
