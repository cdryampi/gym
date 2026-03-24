import { cmsDocumentSchema } from "@/lib/validators/cms-document";

const validCmsDocument = {
  key: "legal-privacy",
  kind: "legal",
  slug: "privacidad",
  title: "Politica de privacidad",
  summary: "Como tratamos los datos personales recogidos desde el sitio.",
  body_markdown: "# Responsable\nNova Forza Gym trata los datos con fines operativos y legales.",
  cta_label: "Contactar",
  cta_href: "mailto:hola@novaforza.pe",
  seo_title: "Politica de privacidad | Nova Forza",
  seo_description: "Informacion sobre tratamiento de datos personales en Nova Forza.",
  is_published: true,
} as const;

describe("cmsDocumentSchema", () => {
  it("accepts a valid published document", () => {
    const result = cmsDocumentSchema.safeParse(validCmsDocument);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    const result = cmsDocumentSchema.safeParse({
      ...validCmsDocument,
      slug: "Privacidad Nova",
    });

    expect(result.success).toBe(false);
  });

  it("requires SEO and body depth before publishing", () => {
    const result = cmsDocumentSchema.safeParse({
      ...validCmsDocument,
      body_markdown: "Muy corto",
      seo_title: "Corto",
      seo_description: "Breve",
    });

    expect(result.success).toBe(false);
  });
});
