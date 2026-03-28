import { Lead } from "@/lib/supabase/database.types";
import {
  filterAndSortLeads,
  getAvailableSources,
  getLeadMetadataEntries,
  parseLeadFilters,
} from "./leads";

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "123456789",
    message: "Hello",
    source: "website",
    status: "new",
    created_at: "2023-01-01T10:00:00Z",
    metadata: {},
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@gmail.com",
    phone: "987654321",
    message: "Hi",
    source: "ads",
    status: "contacted",
    created_at: "2023-01-02T10:00:00Z",
    metadata: {},
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob@outlook.com",
    phone: null,
    message: "Hey",
    source: "website",
    status: "closed",
    created_at: "2023-01-01T12:00:00Z",
    metadata: {},
  },
];

describe("leads data helpers", () => {
  describe("parseLeadFilters", () => {
    it("parses valid filters correctly", () => {
      const params = {
        q: "test",
        status: "contacted",
        source: "website",
        sort: "name_asc",
      };
      expect(parseLeadFilters(params)).toEqual({
        q: "test",
        status: "contacted",
        source: "website",
        sort: "name_asc",
      });
    });

    it("uses defaults for invalid or missing filters", () => {
      const params = {
        status: "invalid",
        sort: "invalid",
      };
      expect(parseLeadFilters(params)).toEqual({
        q: "",
        status: "all",
        source: "all",
        sort: "created_desc",
      });
    });
  });

  describe("filterAndSortLeads", () => {
    it("filters by text search (name)", () => {
      const filters = { q: "jane", status: "all" as const, source: "all", sort: "created_desc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Jane Smith");
    });

    it("filters by text search (email)", () => {
      const filters = { q: "outlook", status: "all" as const, source: "all", sort: "created_desc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("bob@outlook.com");
    });

    it("filters by text search (phone)", () => {
      const filters = { q: "987", status: "all" as const, source: "all", sort: "created_desc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result).toHaveLength(1);
      expect(result[0].phone).toBe("987654321");
    });

    it("filters by status", () => {
      const filters = { q: "", status: "contacted" as const, source: "all", sort: "created_desc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });

    it("filters by source", () => {
      const filters = { q: "", status: "all" as const, source: "ads", sort: "created_desc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe("ads");
    });

    it("sorts by created_desc (default)", () => {
      const filters = { q: "", status: "all" as const, source: "all", sort: "created_desc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result[0].id).toBe("2"); // Jan 02
      expect(result[1].id).toBe("3"); // Jan 01 12:00
      expect(result[2].id).toBe("1"); // Jan 01 10:00
    });

    it("sorts by created_asc", () => {
      const filters = { q: "", status: "all" as const, source: "all", sort: "created_asc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result[0].id).toBe("1");
      expect(result[2].id).toBe("2");
    });

    it("sorts by name_asc", () => {
      const filters = { q: "", status: "all" as const, source: "all", sort: "name_asc" as const };
      const result = filterAndSortLeads(mockLeads, filters);
      expect(result[0].name).toBe("Bob Wilson");
      expect(result[1].name).toBe("Jane Smith");
      expect(result[2].name).toBe("John Doe");
    });
  });

  describe("getAvailableSources", () => {
    it("extracts unique sorted sources", () => {
      const sources = getAvailableSources(mockLeads);
      expect(sources).toEqual(["ads", "website"]);
    });
  });

  describe("getLeadMetadataEntries", () => {
    it("prioritizes interest and formats primitive values", () => {
      expect(
        getLeadMetadataEntries({
          demo: true,
          tags: ["fuerza", "prueba"],
          interest: "plan progreso",
        }),
      ).toEqual([
        { key: "interest", label: "Interest", value: "plan progreso" },
        { key: "demo", label: "Demo", value: "Si" },
        { key: "tags", label: "Tags", value: "fuerza, prueba" },
      ]);
    });

    it("returns an empty list for empty or unsupported metadata", () => {
      expect(getLeadMetadataEntries({ nested: { foo: "bar" }, empty: "", nope: [] })).toEqual([]);
      expect(getLeadMetadataEntries(null)).toEqual([]);
    });
  });
});
