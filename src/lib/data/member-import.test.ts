import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MemberImportAuth, MemberImportSupabaseClient } from "./member-import";

function makeCsvBuffer(input: string) {
  return Buffer.from(input, "utf8");
}

async function makeWorkbookBuffer() {
  const workbook = new ExcelJS.Workbook();
  const ignored = workbook.addWorksheet("OTRA HOJA");
  ignored.addRow(["CODIGO", "NOMBRES Y APELLIDOS"]);
  ignored.addRow(["XXX", "No Debe Entrar"]);

  const sheet = workbook.addWorksheet("CLIENTES 2026");
  sheet.addRow([
    "CODIGO",
    "EDAD",
    "FICHA",
    "SEXO",
    "NOMBRES Y APELLIDOS",
    "HARON",
    "TELEFONO",
    "F INICIO",
    "F VENCIMIENTO",
    "PRODUCTO",
    "OBSERVACIONES",
    "URB.",
    "DIRECCIÓN ",
    "CORREO",
    "CUMPLEAÑOS",
    "OCUPACION",
  ]);
  sheet.addRow([
    "010",
    "",
    "LLENO FICHA",
    "F",
    "MARIA PRUEBA",
    "",
    999111222,
    new Date("2026-05-01T00:00:00.000Z"),
    new Date("2026-06-01T00:00:00.000Z"),
    "PM-1M",
    "Nota heredada",
    "Centro",
    "Av. Demo 123",
    "maria@test.com",
    new Date("1990-02-03T00:00:00.000Z"),
    "Docente",
  ]);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

type TableRow = Record<string, unknown>;

function createImportDoubles(initialMembers: TableRow[] = []) {
  const state = {
    memberProfiles: [...initialMembers],
    planSnapshots: [] as TableRow[],
    calls: {
      createdUsers: [] as Array<{ email: string; password: string; displayName: string }>,
      updatedUsers: [] as Array<{ uid: string; displayName: string }>,
    },
  };

  class QueryBuilder {
    private filters: Array<(row: TableRow) => boolean> = [];
    private operation: "insert" | "select" | "update" = "select";
    private payload: TableRow | null = null;

    constructor(private readonly table: "member_profiles" | "member_plan_snapshots") {}

    select() {
      return this;
    }

    eq(field: string, value: unknown) {
      this.filters.push((row) => row[field] === value);
      return this;
    }

    insert(payload: TableRow) {
      this.operation = "insert";
      this.payload = payload;
      return this;
    }

    update(payload: TableRow) {
      this.operation = "update";
      this.payload = payload;
      return this;
    }

    maybeSingle() {
      return Promise.resolve({ data: this.rows()[0] ?? null, error: null });
    }

    single() {
      const result = this.execute();
      return Promise.resolve({
        data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
        error: result.error,
      });
    }

    then<TResult1 = { data: TableRow | null; error: null }, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: TableRow | null; error: null }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      const result = this.execute();
      return Promise.resolve({
        data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
        error: result.error,
      }).then(onfulfilled, onrejected);
    }

    private rows() {
      return this.tableRows().filter((row) => this.filters.every((filter) => filter(row)));
    }

    private tableRows() {
      return this.table === "member_profiles" ? state.memberProfiles : state.planSnapshots;
    }

    private execute() {
      if (this.operation === "insert") {
        const row = {
          id: `${this.table}-${this.tableRows().length + 1}`,
          ...this.payload,
        };
        this.tableRows().push(row);
        return { data: [row], error: null };
      }

      if (this.operation === "update") {
        for (const row of this.rows()) {
          Object.assign(row, this.payload);
        }
        return { data: this.rows(), error: null };
      }

      return { data: this.rows(), error: null };
    }
  }

  const client = {
    from(table: "member_profiles" | "member_plan_snapshots") {
      return new QueryBuilder(table);
    },
  } satisfies MemberImportSupabaseClient;

  const auth = {
    async getUserByEmail(email: string) {
      if (email === "existing@test.com") {
        return {
          uid: "firebase-existing",
          email,
          displayName: "Existing Name",
        };
      }

      throw { code: "auth/user-not-found" };
    },
    async createUser(input: { email: string; password: string; displayName: string }) {
      state.calls.createdUsers.push(input);
      return {
        uid: `firebase-${input.email}`,
        email: input.email,
        displayName: input.displayName,
      };
    },
    async updateUser(uid: string, input: { displayName: string }) {
      state.calls.updatedUsers.push({ uid, displayName: input.displayName });
      return {
        uid,
        email: null,
        displayName: input.displayName,
      };
    },
  } satisfies MemberImportAuth;

  return { auth, client, state };
}

describe("member import parser", () => {
  it("parses CSV headers, quoted values, accents and date status", async () => {
    const { parseMemberImportFile } = await import("./member-import");
    const csv = [
      "CODIGO,EDAD,FICHA,SEXO,NOMBRES Y APELLIDOS,HARON,TELEFONO,F INICIO,F VENCIMIENTO,PRODUCTO,OBSERVACIONES,URB.,DIRECCIÓN ,CORREO,CUMPLEAÑOS,OCUPACION",
      '001,,LLENO FICHA,F,"MARLENY, ZOLIEL",,957429252,2026-05-01,2026-06-01,PM-1M,"Linea 1',
      'Linea 2",Centro,"Av. Demo 123",member@test.com,1990-03-09,Docente',
    ].join("\n");

    const parsed = await parseMemberImportFile({
      buffer: makeCsvBuffer(csv),
      filename: "socios.csv",
      now: new Date("2026-05-20T00:00:00.000Z"),
    });

    expect(parsed.sheetName).toBe("socios.csv");
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      externalCode: "001",
      fullName: "MARLENY, ZOLIEL",
      email: "member@test.com",
      gender: "F",
      joinDate: "2026-05-01",
      planEndsAt: "2026-06-01",
      planLabel: "PM-1M",
      status: "active",
      legacyNotes: "Linea 1\nLinea 2",
    });
  });

  it("parses XLSX using CLIENTES 2026 before other sheets", async () => {
    const { parseMemberImportFile } = await import("./member-import");

    const parsed = await parseMemberImportFile({
      buffer: await makeWorkbookBuffer(),
      filename: "socios.xlsx",
      now: new Date("2026-05-20T00:00:00.000Z"),
    });

    expect(parsed.sheetName).toBe("CLIENTES 2026");
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      externalCode: "010",
      fullName: "MARIA PRUEBA",
      birthDate: "1990-02-03",
      status: "active",
    });
  });

  it("marks invalid rows as skipped in preview", async () => {
    const { runMemberImport } = await import("./member-import");
    const csv = [
      "CODIGO,NOMBRES Y APELLIDOS,F VENCIMIENTO,CORREO",
      "001,Ana Valida,2026-06-01,ana@test.com",
      "002,Correo Malo,2026-06-01,correo malo@test.com",
      "003,,2026-06-01,nombre@test.com",
      "001,Duplicado,2026-06-01,dup@test.com",
    ].join("\n");

    const result = await runMemberImport({
      buffer: makeCsvBuffer(csv),
      filename: "socios.csv",
      mode: "preview",
      now: new Date("2026-05-20T00:00:00.000Z"),
    });

    expect(result.summary).toEqual({
      totalRows: 4,
      processed: 1,
      skipped: 3,
      errors: 0,
    });
    expect(result.results.map((entry) => entry.status)).toEqual([
      "processed",
      "skipped",
      "skipped",
      "skipped",
    ]);
  });
});

describe("member import commit", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("creates member profile, plan snapshot and Firebase user", async () => {
    const { runMemberImport } = await import("./member-import");
    const doubles = createImportDoubles();
    const csv = [
      "CODIGO,NOMBRES Y APELLIDOS,SEXO,TELEFONO,F INICIO,F VENCIMIENTO,PRODUCTO,OBSERVACIONES,URB.,DIRECCIÓN ,CORREO,CUMPLEAÑOS,OCUPACION",
      "001,Ana Nueva,F,999111222,2026-05-01,2026-06-01,PM-1M,Sin deuda,Centro,Av. Demo,ana@test.com,1990-01-02,Coach",
    ].join("\n");

    const result = await runMemberImport({
      auth: doubles.auth,
      buffer: makeCsvBuffer(csv),
      client: doubles.client,
      defaultPassword: "Temporal123!",
      filename: "socios.csv",
      mode: "commit",
      now: new Date("2026-05-20T00:00:00.000Z"),
    });

    expect(result.summary.processed).toBe(1);
    expect(doubles.state.calls.createdUsers).toEqual([
      { email: "ana@test.com", password: "Temporal123!", displayName: "Ana Nueva" },
    ]);
    expect(doubles.state.memberProfiles[0]).toMatchObject({
      external_code: "001",
      full_name: "Ana Nueva",
      email: "ana@test.com",
      supabase_user_id: "firebase-ana@test.com",
      status: "active",
    });
    expect(doubles.state.planSnapshots[0]).toMatchObject({
      member_id: "member_profiles-1",
      label: "PM-1M",
      status: "active",
      started_at: "2026-05-01",
      ends_at: "2026-06-01",
    });
  });

  it("updates existing profile by external code and reuses existing Firebase user", async () => {
    const { runMemberImport } = await import("./member-import");
    const doubles = createImportDoubles([
      {
        id: "member-1",
        external_code: "009",
        member_number: "NF-OLD",
        full_name: "Old Name",
        email: "old@test.com",
      },
    ]);
    const csv = [
      "CODIGO,NOMBRES Y APELLIDOS,F INICIO,F VENCIMIENTO,PRODUCTO,CORREO",
      "009,Nombre Actualizado,2026-05-01,2026-06-01,PM-1M,existing@test.com",
    ].join("\n");

    const result = await runMemberImport({
      auth: doubles.auth,
      buffer: makeCsvBuffer(csv),
      client: doubles.client,
      defaultPassword: "Temporal123!",
      filename: "socios.csv",
      mode: "commit",
      now: new Date("2026-05-20T00:00:00.000Z"),
    });

    expect(result.results[0]).toMatchObject({
      status: "processed",
      action: "updated",
      firebaseAction: "existing",
    });
    expect(doubles.state.calls.createdUsers).toEqual([]);
    expect(doubles.state.memberProfiles[0]).toMatchObject({
      full_name: "Nombre Actualizado",
      email: "existing@test.com",
      supabase_user_id: "firebase-existing",
    });
  });

  it("does not mutate Firebase or Supabase in preview", async () => {
    const { runMemberImport } = await import("./member-import");
    const doubles = createImportDoubles();
    const csv = [
      "CODIGO,NOMBRES Y APELLIDOS,F VENCIMIENTO,CORREO",
      "001,Ana Valida,2026-06-01,ana@test.com",
    ].join("\n");

    await runMemberImport({
      auth: doubles.auth,
      buffer: makeCsvBuffer(csv),
      client: doubles.client,
      defaultPassword: "Temporal123!",
      filename: "socios.csv",
      mode: "preview",
      now: new Date("2026-05-20T00:00:00.000Z"),
    });

    expect(doubles.state.memberProfiles).toEqual([]);
    expect(doubles.state.planSnapshots).toEqual([]);
    expect(doubles.state.calls.createdUsers).toEqual([]);
  });
});
