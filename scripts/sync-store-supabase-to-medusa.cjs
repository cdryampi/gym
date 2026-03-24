#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * sync-store-supabase-to-medusa
 *
 * Reads store_categories and products from Supabase and upserts them into
 * Medusa, then persists the Medusa IDs back to Supabase.
 *
 * Usage:
 *   npm run sync:store:medusa
 *
 * Required env vars (loaded from .env.local automatically):
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { createClient } = require("@supabase/supabase-js");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT_DIR = path.resolve(__dirname, "..");
const MEDUSA_DIR = path.join(ROOT_DIR, "apps", "medusa");
const MEDUSA_SYNC_SCRIPT = path.join(MEDUSA_DIR, "src", "scripts", "sync-supabase.ts");
const MEDUSA_TEMP_DIR = path.join(MEDUSA_DIR, "src", "scripts", "temp");

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

function loadEnvFiles() {
  const envFiles = [
    path.join(ROOT_DIR, ".env"),
    path.join(ROOT_DIR, ".env.local"),
    path.join(MEDUSA_DIR, ".env"),
    path.join(MEDUSA_DIR, ".env.local"),
  ];

  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile)) continue;
    const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const sep = line.indexOf("=");
      if (sep <= 0) continue;
      const key = line.slice(0, sep).trim();
      if (!key) continue;
      const raw = line.slice(sep + 1).trim();
      const value =
        (raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))
          ? raw.slice(1, -1)
          : raw;
      process.env[key] = value;
    }
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function fail(message, details) {
  console.error(`[sync] ERROR: ${message}`);
  if (details) {
    console.error(details instanceof Error ? details.stack || details.message : details);
  }
  process.exit(1);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) fail(`Missing required environment variable: ${name}`);
  return value;
}

function resolveSupabaseUrl() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) fail("Missing env: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

function toPublicAssetUrl(value, baseUrl) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const base = baseUrl.replace(/\/$/, "");
  return value.startsWith("/") ? `${base}${value}` : `${base}/${value}`;
}

// ---------------------------------------------------------------------------
// Build sync input from Supabase data
// ---------------------------------------------------------------------------

function buildSyncInput(categories, products) {
  const assetBaseUrl =
    process.env.MEDUSA_SYNC_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  return {
    categories: categories.map((c) => ({
      id: c.id,
      active: c.active,
      description: c.description,
      medusa_category_id: c.medusa_category_id,
      name: c.name,
      order: c.order,
      parent_id: c.parent_id,
      slug: c.slug,
    })),
    products: products.map((p) => ({
      active: p.active,
      benefits: Array.isArray(p.benefits) ? p.benefits : [],
      category: p.category,
      category_id: p.category_id,
      compare_price: p.compare_price,
      cta_label: p.cta_label,
      currency: p.currency,
      description: p.description,
      discount_label: p.discount_label,
      eyebrow: p.eyebrow,
      featured: p.featured,
      highlights: Array.isArray(p.highlights) ? p.highlights : [],
      id: p.id,
      images: (Array.isArray(p.images) ? p.images : [])
        .map((img) => toPublicAssetUrl(img, assetBaseUrl))
        .filter(Boolean),
      medusa_product_id: p.medusa_product_id,
      name: p.name,
      order: p.order,
      pickup_eta: p.pickup_eta,
      pickup_note: p.pickup_note,
      pickup_only: p.pickup_only,
      pickup_summary: p.pickup_summary,
      price: p.price,
      short_description: p.short_description,
      slug: p.slug,
      specifications:
        p.specifications && typeof p.specifications === "object" ? p.specifications : {},
      stock_status: p.stock_status,
      tags: Array.isArray(p.tags) ? p.tags : [],
      usage_steps: Array.isArray(p.usage_steps) ? p.usage_steps : [],
    })),
  };
}

// ---------------------------------------------------------------------------
// Run medusa exec with the standalone sync script
// ---------------------------------------------------------------------------

function runMedusaSync(syncInput) {
  if (!fs.existsSync(MEDUSA_SYNC_SCRIPT)) {
    fail(
      "Medusa sync script not found. Expected: " + MEDUSA_SYNC_SCRIPT,
    );
  }

  if (!fs.existsSync(MEDUSA_TEMP_DIR)) {
    fs.mkdirSync(MEDUSA_TEMP_DIR, { recursive: true });
  }

  const inputFile = path.join(MEDUSA_TEMP_DIR, "sync-input.json");
  const outputFile = path.join(MEDUSA_TEMP_DIR, "sync-output.json");

  fs.writeFileSync(inputFile, JSON.stringify(syncInput, null, 2));
  fs.writeFileSync(outputFile, JSON.stringify({ categories: [], products: [] }));

  const result = spawnSync(
    "npx",
    ["medusa", "exec", "src/scripts/sync-supabase.ts"],
    {
      cwd: MEDUSA_DIR,
      shell: true,
      env: {
        ...process.env,
        MEDUSA_SUPABASE_SYNC_INPUT: inputFile,
        MEDUSA_SUPABASE_SYNC_OUTPUT: outputFile,
      },
      encoding: "utf8",
      stdio: "pipe",
    },
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    fail(`medusa exec failed with exit code ${result.status ?? "?"}`);
  }

  try {
    return JSON.parse(fs.readFileSync(outputFile, "utf8"));
  } catch (err) {
    fail("Could not parse medusa sync output.", err);
  }
}

// ---------------------------------------------------------------------------
// Write Medusa IDs back to Supabase
// ---------------------------------------------------------------------------

async function persistMedusaIds(supabase, syncResult) {
  for (const category of syncResult.categories ?? []) {
    const { error } = await supabase
      .from("store_categories")
      .update({ medusa_category_id: category.medusa_id })
      .eq("id", category.supabase_id);
    if (error) {
      fail(`Failed to persist medusa_category_id for ${category.handle}: ${error.message}`);
    }
  }

  for (const product of syncResult.products ?? []) {
    const { error } = await supabase
      .from("products")
      .update({ medusa_product_id: product.medusa_id })
      .eq("id", product.supabase_id);
    if (error) {
      fail(`Failed to persist medusa_product_id for ${product.handle}: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  loadEnvFiles();

  const supabase = createClient(resolveSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Load catalog from Supabase
  const { data: categories, error: catErr } = await supabase
    .from("store_categories")
    .select("id, active, description, medusa_category_id, name, order, parent_id, slug")
    .order("order", { ascending: true })
    .order("name", { ascending: true });

  if (catErr) fail("Could not load store_categories from Supabase.", catErr.message);

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select(`
      id, active, benefits, category, category_id, compare_price, cta_label, currency,
      description, discount_label, eyebrow, featured, highlights, images,
      medusa_product_id, name, order, pickup_eta, pickup_note, pickup_only,
      pickup_summary, price, short_description, slug, specifications,
      stock_status, tags, usage_steps
    `)
    .order("order", { ascending: true })
    .order("name", { ascending: true });

  if (prodErr) fail("Could not load products from Supabase.", prodErr.message);

  const syncInput = buildSyncInput(categories ?? [], products ?? []);
  console.log(
    `[sync] Loaded ${syncInput.categories.length} categories and ${syncInput.products.length} products from Supabase.`,
  );

  // Run sync inside Medusa
  const syncResult = runMedusaSync(syncInput);

  // Persist Medusa IDs back to Supabase
  await persistMedusaIds(supabase, syncResult);

  console.log(
    `[sync] Done. Categories: ${syncResult.categories.length}. Products: ${syncResult.products.length}.`,
  );
}

main().catch((err) => fail("Fatal sync failure.", err));
