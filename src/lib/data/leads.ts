import { Json, Lead, LeadStatus } from "@/lib/supabase/database.types";

export type LeadSort = "created_desc" | "created_asc" | "name_asc";

export interface LeadMetadataEntry {
  key: string;
  label: string;
  value: string;
}

export interface LeadFilters {
  q: string;
  status: LeadStatus | "all";
  source: string | "all";
  sort: LeadSort;
}

export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  q: "",
  status: "all",
  source: "all",
  sort: "created_desc",
};

/**
 * Normalizes search params into a valid LeadFilters object.
 */
export function parseLeadFilters(params: Record<string, string | string[] | undefined>): LeadFilters {
  const q = typeof params.q === "string" ? params.q.trim() : DEFAULT_LEAD_FILTERS.q;

  let status = DEFAULT_LEAD_FILTERS.status;
  if (params.status === "new" || params.status === "contacted" || params.status === "closed") {
    status = params.status;
  }

  const source = typeof params.source === "string" ? params.source : DEFAULT_LEAD_FILTERS.source;

  let sort = DEFAULT_LEAD_FILTERS.sort;
  if (params.sort === "created_desc" || params.sort === "created_asc" || params.sort === "name_asc") {
    sort = params.sort;
  }

  return { q, status, source, sort };
}

/**
 * Applies search, filtering and sorting to a list of leads.
 */
export function filterAndSortLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  let filtered = [...leads];

  // 1. Text Search (name, email, phone)
  if (filters.q) {
    const query = filters.q.toLowerCase();
    filtered = filtered.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        (lead.phone && lead.phone.toLowerCase().includes(query)),
    );
  }

  // 2. Status Filter
  if (filters.status !== "all") {
    filtered = filtered.filter((lead) => lead.status === filters.status);
  }

  // 3. Source Filter
  if (filters.source !== "all") {
    filtered = filtered.filter((lead) => lead.source === filters.source);
  }

  // 4. Sort
  filtered.sort((a, b) => {
    switch (filters.sort) {
      case "created_asc":
        return a.created_at.localeCompare(b.created_at);
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "created_desc":
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });

  return filtered;
}

/**
 * Extracts unique sources from a list of leads for filter options.
 */
export function getAvailableSources(leads: Lead[]): string[] {
  const sources = new Set(leads.map((lead) => lead.source).filter(Boolean));
  return Array.from(sources).sort();
}

function humanizeMetadataKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function stringifyMetadataValue(value: Json | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => stringifyMetadataValue(entry))
      .filter((entry): entry is string => Boolean(entry));

    return parts.length ? parts.join(", ") : null;
  }

  return null;
}

export function getLeadMetadataEntries(metadata: Json | null | undefined): LeadMetadataEntry[] {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    return [];
  }

  const entries = Object.entries(metadata)
    .map(([key, value]) => {
      const renderedValue = stringifyMetadataValue(value);

      if (!renderedValue) {
        return null;
      }

      return {
        key,
        label: humanizeMetadataKey(key),
        value: renderedValue,
      } satisfies LeadMetadataEntry;
    })
    .filter((entry): entry is LeadMetadataEntry => Boolean(entry));

  const interestIndex = entries.findIndex((entry) => entry.key === "interest");

  if (interestIndex <= 0) {
    return entries;
  }

  const [interestEntry] = entries.splice(interestIndex, 1);
  entries.unshift(interestEntry);

  return entries;
}
