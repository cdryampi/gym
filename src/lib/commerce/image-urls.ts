import { SITE_URL } from "@/lib/seo";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1"]);
const DEFAULT_PRODUCTS_PATH = "/images/products";
export const PRODUCT_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_COMMERCE_MEDIA_BUCKET ??
  process.env.COMMERCE_MEDIA_BUCKET ??
  "medusa-media";
const DEFAULT_PRODUCTS_BUCKET = PRODUCT_IMAGES_BUCKET;

function trimUrl(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function getSupabaseAssetOrigin() {
  const candidate =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? null;

  if (!candidate) {
    return null;
  }

  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

function getSupabaseProductsBucketUrl() {
  const origin = getSupabaseAssetOrigin();

  if (!origin) {
    return null;
  }

  return joinUrl(
    origin,
    `/storage/v1/object/public/${DEFAULT_PRODUCTS_BUCKET}`,
  );
}

function toSupabaseBucketUrl(pathname: string) {
  const bucketBaseUrl = getSupabaseProductsBucketUrl();

  if (!bucketBaseUrl) {
    return null;
  }

  const fileName = pathname.split("/").filter(Boolean).at(-1);

  if (!fileName) {
    return null;
  }

  return joinUrl(bucketBaseUrl, `/${encodeURIComponent(fileName)}`);
}

function normalizePathname(pathname: string) {
  if (!pathname) {
    return null;
  }

  if (pathname.startsWith("/storage/v1/object/public/")) {
    const supabaseOrigin = getSupabaseAssetOrigin();
    return supabaseOrigin ? joinUrl(supabaseOrigin, pathname) : pathname;
  }

  if (pathname.startsWith(`${DEFAULT_PRODUCTS_PATH}/`)) {
    return toSupabaseBucketUrl(pathname) ?? pathname;
  }

  if (pathname.startsWith("/images/")) {
    return pathname;
  }

  return toSupabaseBucketUrl(pathname) ?? `${DEFAULT_PRODUCTS_PATH}/${pathname.replace(/^\/+/, "")}`;
}

export function normalizeCommerceImageUrl(value: string | null | undefined) {
  const candidate = trimUrl(value);

  if (!candidate) {
    return null;
  }

  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);

      if (LOCALHOST_HOSTS.has(parsed.hostname)) {
        return normalizePathname(parsed.pathname) ?? candidate;
      }

      return parsed.toString();
    } catch {
      return candidate;
    }
  }

  if (candidate.startsWith("/")) {
    return normalizePathname(candidate) ?? candidate;
  }

  return normalizePathname(candidate) ?? joinUrl(SITE_URL, DEFAULT_PRODUCTS_PATH);
}

export function normalizeCommerceImageUrls(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeCommerceImageUrl(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}
