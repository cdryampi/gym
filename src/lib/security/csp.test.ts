import { describe, expect, it } from "vitest";

import {
  buildNonceContentSecurityPolicy,
  buildStaticContentSecurityPolicy,
} from "@/lib/security/csp";

describe("Content Security Policy", () => {
  it("does not allow unsafe eval in the production policy", () => {
    const policy = buildStaticContentSecurityPolicy(false);

    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("keeps unsafe eval limited to development", () => {
    expect(buildStaticContentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(buildNonceContentSecurityPolicy("dev-nonce", true)).toContain("'unsafe-eval'");
  });

  it("keeps authenticated routes hydration-compatible without unsafe eval", () => {
    const policy = buildNonceContentSecurityPolicy("nonce-value");

    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).not.toContain("'nonce-nonce-value'");
    expect(policy).not.toContain("'strict-dynamic'");
    expect(policy).not.toContain("'unsafe-eval'");
  });
});
