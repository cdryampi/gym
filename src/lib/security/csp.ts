const PAYPAL_SCRIPT_SOURCES = ["https://www.paypal.com"];
const FIREBASE_SCRIPT_SOURCES = [
  "https://www.gstatic.com",
  "https://apis.google.com",
  "https://*.firebaseapp.com",
];

const COMMON_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://*.supabase.co https://*.supabase.in https://*.paypal.com https://*.paypalobjects.com https://*.googleusercontent.com https://medusa-public-images.s3.eu-west-1.amazonaws.com https://*.gstatic.com",
  "media-src 'self' https://*.supabase.co https://*.supabase.in",
  "font-src 'self' https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src https://www.paypal.com https://*.firebaseapp.com",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.googleapis.com https://*.paypal.com https://*.firebaseio.com",
  "upgrade-insecure-requests",
];

function serializeDirectives(directives: string[]) {
  return directives.map((directive) => `${directive};`).join(" ");
}

export function buildStaticContentSecurityPolicy(isDevelopment = false) {
  const scripts = [
    "'self'",
    "'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ...PAYPAL_SCRIPT_SOURCES,
    ...FIREBASE_SCRIPT_SOURCES,
  ];

  return serializeDirectives([
    `script-src ${scripts.join(" ")}`,
    ...COMMON_DIRECTIVES,
  ]);
}

export function buildNonceContentSecurityPolicy(nonce: string, isDevelopment = false) {
  // Next.js 16 currently emits framework chunks and bootstrap scripts without
  // the request nonce on these routes. Keep the nonce API isolated here, but
  // use the hydration-compatible policy until every emitted script is nonced.
  void nonce;
  return buildStaticContentSecurityPolicy(isDevelopment);
}
