import { describe, expect, it } from "vitest";

import {
  formatMemberAccountDate,
  getMemberAccountQuickLinks,
  getMemberAuthProviderLabel,
} from "@/lib/member-account";

describe("member account helpers", () => {
  it("formats account dates and falls back when missing", () => {
    expect(formatMemberAccountDate(null)).toBe("Sin registro");
    expect(formatMemberAccountDate("2026-03-30T10:30:00.000Z")).not.toBe("Sin registro");
  });

  it("maps auth providers into member-facing labels", () => {
    expect(
      getMemberAuthProviderLabel({
        app_metadata: { provider: "password" },
      }),
    ).toBe("Email y contrasena");

    expect(
      getMemberAuthProviderLabel({
        identities: [{ provider: "google" }],
      }),
    ).toBe("Google");

    expect(getMemberAuthProviderLabel({})).toBe("Acceso basico");
  });

  it("returns useful quick links for members", () => {
    expect(
      getMemberAccountQuickLinks({
        hasActiveCart: true,
        hasPickupHistory: true,
      }),
    ).toEqual([
      {
        href: "/carrito",
        label: "Retomar carrito",
        description: "Continua tu compra pickup desde el punto donde la dejaste.",
      },
      {
        href: "#pedidos-pickup",
        label: "Ver pedidos pickup",
        description: "Baja al resumen de pedidos pickup asociados a tu cuenta.",
      },
      {
        href: "/horarios",
        label: "Horarios del club",
        description: "Consulta cuando pasar por el club para recoger o entrenar.",
      },
    ]);
  });
});
