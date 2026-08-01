import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import {
  createDefaultModuleStateMap,
  SYSTEM_MODULE_DEFINITIONS,
  type SystemModuleName,
  type SystemModuleRow,
  type SystemModuleStateMap,
} from "@/lib/module-flags";
import { getDashboardAccessState } from "@/lib/auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

type SystemModuleRecord = Pick<
  Database["public"]["Tables"]["system_modules"]["Row"],
  "description" | "id" | "is_enabled" | "name" | "updated_at"
>;

function isSystemModulesSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return normalized.includes("system_modules") && (
    normalized.includes("does not exist") ||
    normalized.includes("relation") ||
    normalized.includes("schema cache") ||
    normalized.includes("could not find")
  );
}

async function fetchSystemModules(): Promise<SystemModuleRecord[]> {
  if (hasSupabaseServiceRole()) {
    const client = createSupabaseAdminClient();
    const { data, error } = await client
      .from("system_modules")
      .select("id, name, is_enabled, description, updated_at");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as SystemModuleRecord[];
  }

  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("system_modules")
    .select("id, name, is_enabled, description, updated_at");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SystemModuleRecord[];
}

const getSystemModulesCached = cache(async function getSystemModulesCached() {
  try {
    return await fetchSystemModules();
  } catch (error) {
    if (isSystemModulesSchemaError(error)) {
      return [];
    }

    if (!hasSupabaseServiceRole()) {
      return [];
    }

    throw error;
  }
});

function mergeModuleStates(rows: SystemModuleRecord[]): SystemModuleStateMap {
  const state = createDefaultModuleStateMap();

  for (const row of rows) {
    if (row.name in state) {
      state[row.name as SystemModuleName] = row.is_enabled;
    }
  }

  return state;
}

export async function getActiveModules(): Promise<SystemModuleStateMap> {
  const rows = await getSystemModulesCached();
  return mergeModuleStates(rows);
}

export async function listSystemModules(): Promise<SystemModuleRow[]> {
  const rows = await getSystemModulesCached();
  const rowsByName = new Map(rows.map((row) => [row.name, row]));

  return SYSTEM_MODULE_DEFINITIONS.map((module, index) => {
    const row = rowsByName.get(module.name);

    return {
      id: row?.id ?? index + 1,
      name: module.name,
      is_enabled: row?.is_enabled ?? true,
      description: row?.description ?? module.description,
      updated_at: row?.updated_at ?? new Date(0).toISOString(),
      label: module.label,
      disabledImpact: module.disabledImpact,
    };
  });
}

export async function isModuleEnabled(name: SystemModuleName) {
  const activeModules = await getActiveModules();
  return activeModules[name];
}

function canBypassDisabledModules(accessMode: string | null) {
  return accessMode === "superadmin";
}

export async function assertModuleEnabledOrNotFound(
  name: SystemModuleName,
  accessState?: Awaited<ReturnType<typeof getDashboardAccessState>>,
) {
  const activeModules = await getActiveModules();

  // Public routes stay cacheable while their module is enabled. Session lookup
  // reads cookies, so only resolve it for the disabled-module superadmin bypass.
  if (activeModules[name]) {
    return;
  }

  const resolvedAccessState = accessState ?? await getDashboardAccessState();

  if (canBypassDisabledModules(resolvedAccessState.accessMode)) {
    return;
  }

  notFound();
}
