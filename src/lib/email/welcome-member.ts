import { defaultSiteSettings } from "@/lib/data/default-content";

import { sendResendEmail } from "./resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendMemberWelcomeEmail(
  email: string,
  siteName?: string | null,
  fromEmail?: string | null,
  replyTo?: string | null,
) {
  const resolvedSiteName = siteName?.trim() || defaultSiteSettings.site_name;
  const safeEmail = escapeHtml(email);
  const safeSiteName = escapeHtml(resolvedSiteName);
  const loginUrl = "/acceso";

  await sendResendEmail({
    to: email,
    from: fromEmail ?? undefined,
    replyTo: replyTo ?? undefined,
    subject: `${resolvedSiteName} | Tu cuenta ya esta creada`,
    html: `
      <div style="margin:0;padding:32px;background:#f5f5f0;font-family:Arial,sans-serif;color:#111111;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">
          <div style="padding:32px;border-bottom:4px solid #d71920;">
            <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;color:#d71920;">${safeSiteName}</div>
            <h1 style="margin:14px 0 0;font-size:32px;line-height:1.1;text-transform:uppercase;">Tu cuenta ya esta creada</h1>
            <p style="margin:16px 0 0;color:#4b5563;line-height:1.8;">
              Hemos preparado tu acceso con el email <strong>${safeEmail}</strong>.
            </p>
          </div>
          <div style="padding:32px;">
            <p style="margin:0;color:#4b5563;line-height:1.8;">
              Si todavia no has confirmado tu correo, revisa tu bandeja de entrada y completa ese paso.
              Despues podras entrar en tu zona privada y seguir tus pedidos pickup desde la web.
            </p>
            <div style="margin-top:24px;">
              <a href="${loginUrl}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:700;">
                Ir a acceso
              </a>
            </div>
          </div>
        </div>
      </div>
    `,
    text: [
      `${resolvedSiteName} - Tu cuenta ya esta creada`,
      `Email: ${email}`,
      "",
      "Si todavia no has confirmado tu correo, revisa tu bandeja de entrada y completa ese paso.",
      "Despues podras entrar en tu zona privada y seguir tus pedidos pickup desde la web.",
      "",
      `Acceso: ${loginUrl}`,
    ].join("\n"),
  });
}
