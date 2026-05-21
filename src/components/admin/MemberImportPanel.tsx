"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, PlayCircle, Upload, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImportStatus = "processed" | "skipped" | "error";

type ImportResult = {
  action?: "created" | "updated" | "ready";
  code?: string;
  email?: string;
  firebaseAction?: "created" | "existing" | "none";
  memberId?: string;
  message?: string;
  name?: string;
  rowNumber: number;
  status: ImportStatus;
};

type ImportResponse = {
  results: ImportResult[];
  sheetName: string;
  summary: {
    errors: number;
    processed: number;
    skipped: number;
    totalRows: number;
  };
};

const STATUS_META = {
  processed: {
    icon: CheckCircle2,
    label: "Procesado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  skipped: {
    icon: AlertTriangle,
    label: "Saltado",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  error: {
    icon: XCircle,
    label: "Error",
    className: "border-red-200 bg-red-50 text-red-700",
  },
} satisfies Record<ImportStatus, { className: string; icon: typeof CheckCircle2; label: string }>;

function actionLabel(result: ImportResult) {
  if (result.status === "skipped") return result.message ?? "Fila no migrada";
  if (result.status === "error") return result.message ?? "Error al importar";
  if (result.action === "ready") return "Lista para confirmar";
  if (result.action === "updated") return "Ficha actualizada";
  if (result.firebaseAction === "existing") return "Firebase existente vinculado";
  if (result.firebaseAction === "created") return "Firebase creado con clave temporal";
  return "Ficha creada";
}

async function uploadImport(file: File, mode: "preview" | "commit") {
  const body = new FormData();
  body.set("mode", mode);
  body.set("file", file);

  const response = await fetch("/api/dashboard/members/import", {
    method: "POST",
    body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "No se pudo procesar el archivo.");
  }

  return payload as ImportResponse;
}

export default function MemberImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<"preview" | "commit" | null>(null);
  const [pendingMode, setPendingMode] = useState<"preview" | "commit" | null>(null);
  const isPending = Boolean(pendingMode);

  const canCommit = Boolean(file && result && lastMode === "preview" && result.summary.processed > 0);

  const previewTone = useMemo(() => {
    if (!result) return "idle";
    if (result.summary.errors > 0) return "error";
    if (result.summary.skipped > 0) return "warning";
    return "success";
  }, [result]);

  function run(mode: "preview" | "commit") {
    if (!file) {
      setError("Selecciona un archivo CSV o XLSX.");
      return;
    }

    setError(null);
    setPendingMode(mode);
    void uploadImport(file, mode)
      .then((nextResult) => {
        setResult(nextResult);
        setLastMode(mode);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "Error inesperado.");
      })
      .finally(() => {
        setPendingMode(null);
      });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <section className="space-y-6 border border-black/5 bg-white p-8 shadow-xl shadow-black/[0.03]">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center bg-[#111111] text-white">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d71920]">
              Fuente
            </p>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#111111]">
              Archivo legacy
            </h2>
          </div>
        </div>

        <label className="group flex min-h-44 cursor-pointer flex-col items-center justify-center gap-4 border border-dashed border-black/15 bg-black/[0.02] p-8 text-center transition-colors hover:border-[#d71920]/40 hover:bg-red-50/30">
          <Upload className="size-8 text-[#d71920]" />
          <span className="text-sm font-black uppercase tracking-[0.16em] text-[#111111]">
            {file ? file.name : "Subir CSV o XLSX"}
          </span>
          <span className="text-xs font-bold leading-6 text-[#7a7f87]">
            Usa cabeceras del control de alumnos. La hoja preferida es CLIENTES 2026.
          </span>
          <input
            className="sr-only"
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => {
              setResult(null);
              setLastMode(null);
              setError(null);
              setFile(event.target.files?.[0] ?? null);
            }}
          />
        </label>

        {error ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={!file || isPending}
            loading={pendingMode === "preview"}
            onClick={() => run("preview")}
            className="h-14 uppercase tracking-[0.18em]"
          >
            <Upload className="size-4" />
            Previsualizar
          </Button>
          <Button
            type="button"
            disabled={!canCommit || isPending}
            loading={pendingMode === "commit"}
            onClick={() => run("commit")}
            className="h-14 uppercase tracking-[0.18em]"
          >
            <PlayCircle className="size-4" />
            Confirmar migracion
          </Button>
        </div>
      </section>

      <section className="min-w-0 space-y-6">
        <div
          className={cn(
            "grid gap-4 md:grid-cols-3",
            previewTone === "idle" && "opacity-60",
          )}
        >
          <div className="border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              Verde
            </p>
            <p className="mt-3 text-4xl font-black tracking-tighter text-emerald-700">
              {result?.summary.processed ?? 0}
            </p>
            <p className="mt-2 text-xs font-bold uppercase text-emerald-700/70">Procesadas</p>
          </div>
          <div className="border border-amber-200 bg-amber-50 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
              Amarillo
            </p>
            <p className="mt-3 text-4xl font-black tracking-tighter text-amber-700">
              {result?.summary.skipped ?? 0}
            </p>
            <p className="mt-2 text-xs font-bold uppercase text-amber-700/70">No migradas</p>
          </div>
          <div className="border border-red-200 bg-red-50 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700">
              Rojo
            </p>
            <p className="mt-3 text-4xl font-black tracking-tighter text-red-700">
              {result?.summary.errors ?? 0}
            </p>
            <p className="mt-2 text-xs font-bold uppercase text-red-700/70">Errores</p>
          </div>
        </div>

        <div className="overflow-hidden border border-black/5 bg-white shadow-xl shadow-black/[0.03]">
          <div className="flex flex-col gap-2 border-b border-black/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[#111111]">
                Resultado
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a7f87]">
                {result
                  ? `${result.summary.totalRows} lineas leidas desde ${result.sheetName}`
                  : "Esperando previsualizacion"}
              </p>
            </div>
            {lastMode ? (
              <Badge variant={lastMode === "commit" ? "success" : "warning"}>
                {lastMode === "commit" ? "Migracion ejecutada" : "Previsualizacion"}
              </Badge>
            ) : null}
          </div>

          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="sticky top-0 bg-[#111111] text-white">
                <tr className="text-[10px] font-black uppercase tracking-[0.18em]">
                  <th className="px-4 py-3">Linea</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {(result?.results ?? []).map((entry) => {
                  const meta = STATUS_META[entry.status];
                  const Icon = meta.icon;

                  return (
                    <tr key={`${entry.rowNumber}-${entry.code}`} className="border-b border-black/5">
                      <td className="px-4 py-4 text-xs font-black text-[#111111]">{entry.rowNumber}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                            meta.className,
                          )}
                        >
                          <Icon className="size-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-[#111111]">{entry.code || "---"}</td>
                      <td className="px-4 py-4 text-xs font-bold text-[#111111]">{entry.name || "---"}</td>
                      <td className="px-4 py-4 text-xs font-medium text-[#5f6368]">{entry.email || "---"}</td>
                      <td className="px-4 py-4 text-xs font-bold text-[#5f6368]">{actionLabel(entry)}</td>
                    </tr>
                  );
                })}
                {!result ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-xs font-black uppercase tracking-[0.2em] text-[#7a7f87]">
                      Sube archivo y previsualiza antes de confirmar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
