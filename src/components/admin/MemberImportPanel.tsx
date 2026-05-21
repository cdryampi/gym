"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  PlayCircle,
  Upload,
  XCircle,
  History,
  Info,
  ArrowRight,
  Eye,
  Calendar,
  FileDown,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImportStatus = "created" | "updated" | "skipped" | "failed";

interface MemberImportRowResult {
  rowNumber: number;
  email: string;
  firstName: string;
  lastName: string;
  status: ImportStatus;
  errors: string[];
  warnings: string[];
  firebaseUid?: string;
  memberProfileId?: string;
  membershipRequestId?: string;
  rawRow: Record<string, string>;
}

interface MemberImportBatchResult {
  id?: string;
  file_name?: string; // from Supabase snake_case
  fileName?: string;  // from DTO camelCase
  created_at?: string;
  created_by_email?: string;
  total_rows?: number;
  valid_rows?: number;
  invalid_rows?: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  rows?: MemberImportRowResult[];
}

const STATUS_META = {
  created: {
    icon: CheckCircle2,
    label: "Creado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/30",
  },
  updated: {
    icon: UserCheck,
    label: "Actualizado",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30",
  },
  skipped: {
    icon: AlertTriangle,
    label: "Omitido",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30",
  },
  failed: {
    icon: XCircle,
    label: "Error",
    className: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30",
  },
} satisfies Record<ImportStatus, { className: string; icon: typeof CheckCircle2; label: string }>;

export default function MemberImportPanel() {
  const [activeTab, setActiveTab] = useState<"import" | "history">("import");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [validationResult, setValidationResult] = useState<MemberImportBatchResult | null>(null);
  const [executionResult, setExecutionResult] = useState<MemberImportBatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<MemberImportBatchResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedBatch, setSelectedBatch] = useState<MemberImportBatchResult | null>(null);
  const [loadingBatchDetail, setLoadingBatchDetail] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Clean raw file content when file changes
  useEffect(() => {
    if (!file) {
      setFileContent("");
      setValidationResult(null);
      setExecutionResult(null);
      setError(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string || "");
    };
    reader.readAsText(file, "UTF-8");
    setValidationResult(null);
    setExecutionResult(null);
    setError(null);
  }, [file]);

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/member-import/history");
      if (!res.ok) {
        throw new Error("No se pudo obtener el historial de importaciones.");
      }
      const data = await res.json();
      setHistory(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleValidate = async () => {
    if (!file || !fileContent) {
      setError("Por favor selecciona un archivo CSV válido.");
      return;
    }

    setLoading(true);
    setError(null);
    setExecutionResult(null);

    try {
      const response = await fetch("/api/admin/member-import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: fileContent, fileName: file.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fallo en la validación del CSV.");
      }

      setValidationResult(data);
    } catch (err: any) {
      setError(err.message || "Error inesperado durante la validación.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!file || !fileContent || !validationResult) {
      setError("Por favor valida el archivo CSV antes de ejecutar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/member-import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: fileContent, fileName: file.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fallo en la ejecución del lote.");
      }

      setExecutionResult(data);
      setValidationResult(null); // Clear validation to show execution
      setFile(null); // Clear file input
    } catch (err: any) {
      setError(err.message || "Error inesperado durante la importación.");
    } finally {
      setLoading(false);
    }
  };

  const loadBatchDetail = async (batchId: string) => {
    setLoadingBatchDetail(true);
    try {
      const res = await fetch(`/api/admin/member-import/${batchId}`);
      if (!res.ok) {
        throw new Error("No se pudo cargar el detalle del lote.");
      }
      const data = await res.json();
      setSelectedBatch(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar detalles del lote.");
    } finally {
      setLoadingBatchDetail(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "email,first_name,last_name,phone,membership_plan,membership_start_date,membership_end_date,status,document_id,birth_date,address,emergency_contact_name,emergency_contact_phone,notes,send_welcome_email\n" +
      "socio.nuevo1@example.com,Juan,Perez,987654321,mensual,2026-05-01,2026-05-31,active,12345678,1990-05-15,\"Av. Larco 123, Miraflores\",Maria Perez,987654322,\"Socio importado en lote\",false\n" +
      "socio.nuevo2@example.com,Ana,Gomez,987654323,mensual,2026-05-10,,active,87654321,1995-10-20,\"Calle Lima 456, San Isidro\",Carlos Gomez,987654324,\"Dejar end_date vacía para auto-calcular\",false\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_importacion_socios.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewTone = useMemo(() => {
    const result = validationResult || executionResult;
    if (!result) return "idle";
    if (result.failedCount > 0 || (result.invalidRows !== undefined && result.invalidRows > 0)) return "error";
    if (result.skippedCount > 0) return "warning";
    return "success";
  }, [validationResult, executionResult]);

  const displayResult = validationResult || executionResult;

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    const rows = displayResult?.rows || selectedBatch?.rows || [];
    if (!searchTerm.trim()) return rows;

    const term = searchTerm.toLowerCase();
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(term) ||
        r.firstName.toLowerCase().includes(term) ||
        r.lastName.toLowerCase().includes(term) ||
        r.status.toLowerCase().includes(term)
    );
  }, [displayResult, selectedBatch, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Tabs Menu */}
      <div className="flex border-b border-black/5 dark:border-white/5 pb-px">
        <button
          onClick={() => {
            setActiveTab("import");
            setSelectedBatch(null);
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all",
            activeTab === "import"
              ? "border-[#d71920] text-[#111111] dark:text-white"
              : "border-transparent text-[#7a7f87] hover:text-[#111111] dark:hover:text-white"
          )}
        >
          <FileSpreadsheet className="size-4" />
          Importar CSV
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setSelectedBatch(null);
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition-all",
            activeTab === "history"
              ? "border-[#d71920] text-[#111111] dark:text-white"
              : "border-transparent text-[#7a7f87] hover:text-[#111111] dark:hover:text-white"
          )}
        >
          <History className="size-4" />
          Historial de Lotes
        </button>
      </div>

      {activeTab === "import" ? (
        <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
          {/* LEFT: File Selection & Actions */}
          <section className="space-y-6 border border-black/5 dark:border-white/5 bg-white dark:bg-[#151515] p-6 shadow-xl shadow-black/[0.02]">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center bg-[#111111] dark:bg-[#d71920]/10 text-white dark:text-[#d71920]">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d71920]">
                  Carga Legada
                </p>
                <h2 className="text-lg font-black uppercase tracking-tight text-[#111111] dark:text-white">
                  Miembros CSV
                </h2>
              </div>
            </div>

            {/* Custom Drag & Drop Zone */}
            <label className="group flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-black/15 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] p-6 text-center transition-colors hover:border-[#d71920]/40 hover:bg-red-50/20 dark:hover:bg-red-950/5">
              <Upload className="size-8 text-[#d71920] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#111111] dark:text-white">
                {file ? file.name : "Seleccionar Archivo CSV"}
              </span>
              <span className="text-[10px] font-bold leading-5 text-[#7a7f87]">
                Delimitado por coma o punto y coma. Codificación UTF-8.
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                }}
              />
            </label>

            {/* Download Template & Instructions Card */}
            <div className="rounded border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Info className="size-4 text-[#d71920] shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium leading-relaxed text-[#7a7f87]">
                  Usa campos normalizados. Si un socio ya cuenta con ficha o Firebase activo, se
                  actualizarán sus datos sin sobreescribir roles de administradores.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="w-full h-10 text-[10px] font-black uppercase tracking-[0.15em] border-black/15 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <FileDown className="size-3.5" />
                Descargar Plantilla
              </Button>
            </div>

            {error ? (
              <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 text-xs font-bold text-red-700 dark:text-red-400 flex items-start gap-2.5">
                <XCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Actions Grid */}
            <div className="grid gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={!file || loading}
                loading={loading && !validationResult && !executionResult}
                onClick={handleValidate}
                className="h-12 uppercase text-[10px] tracking-[0.2em] font-black"
              >
                <RefreshCw className="size-3.5" />
                Validar Lote
              </Button>
              <Button
                type="button"
                disabled={!validationResult || loading || validationResult.validRows === 0}
                loading={loading && Boolean(validationResult)}
                onClick={handleExecute}
                className="h-12 uppercase text-[10px] tracking-[0.2em] font-black bg-[#d71920] text-white hover:bg-[#d71920]/90"
              >
                <PlayCircle className="size-3.5" />
                Confirmar Importación
              </Button>
            </div>
          </section>

          {/* RIGHT: Results Preview Panel */}
          <section className="min-w-0 space-y-6">
            {/* Status Statistics Cards */}
            <div
              className={cn(
                "grid gap-4 md:grid-cols-4",
                previewTone === "idle" && "opacity-50"
              )}
            >
              <div className="border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/10 p-5 rounded">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                  Nuevos / Creados
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                  {displayResult?.createdCount ?? 0}
                </p>
                <p className="mt-1.5 text-[10px] font-bold uppercase text-emerald-700/60 dark:text-emerald-400/50">
                  Fichas Creadas
                </p>
              </div>
              <div className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/10 p-5 rounded">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                  Actualizados
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-blue-700 dark:text-blue-400">
                  {displayResult?.updatedCount ?? 0}
                </p>
                <p className="mt-1.5 text-[10px] font-bold uppercase text-blue-700/60 dark:text-blue-400/50">
                  Fichas Sincronizadas
                </p>
              </div>
              <div className="border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/10 p-5 rounded">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                  Omitidos / Duplicados
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-amber-700 dark:text-amber-400">
                  {displayResult?.skippedCount ?? 0}
                </p>
                <p className="mt-1.5 text-[10px] font-bold uppercase text-amber-700/60 dark:text-amber-400/50">
                  Ya Existentes / Salteados
                </p>
              </div>
              <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/10 p-5 rounded">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-400">
                  Inválidos / Errores
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-red-700 dark:text-red-400">
                  {displayResult ? (displayResult.failedCount || displayResult.invalidRows) : 0}
                </p>
                <p className="mt-1.5 text-[10px] font-bold uppercase text-red-700/60 dark:text-red-400/50">
                  Filas Con Error
                </p>
              </div>
            </div>

            {/* Results Log Table */}
            <div className="overflow-hidden border border-black/5 dark:border-white/5 bg-white dark:bg-[#151515] shadow-xl shadow-black/[0.02] rounded">
              <div className="flex flex-col gap-4 border-b border-black/5 dark:border-white/5 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-[#111111] dark:text-white">
                    Registros del Lote
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7a7f87]">
                    {displayResult
                      ? `${displayResult.totalRows} filas totales en ${
                          displayResult.fileName || "el lote"
                        }`
                      : "Esperando validación de archivo"}
                  </p>
                </div>
                {displayResult ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 size-3.5 text-[#7a7f87]" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8.5 pl-8.5 pr-4 border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded text-xs focus:outline-none focus:border-[#d71920] w-48 font-medium text-[#111111] dark:text-white"
                      />
                    </div>
                    <Badge variant={executionResult ? "success" : "warning"}>
                      {executionResult ? "Procesamiento Completado" : "Borrador Previsualización"}
                    </Badge>
                  </div>
                ) : null}
              </div>

              <div className="max-h-[500px] overflow-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="sticky top-0 bg-[#111111] dark:bg-[#1c1c1c] text-white">
                    <tr className="text-[9px] font-black uppercase tracking-[0.18em]">
                      <th className="px-4 py-3 w-16">Fila</th>
                      <th className="px-4 py-3 w-28">Estado</th>
                      <th className="px-4 py-3 w-44">Socio</th>
                      <th className="px-4 py-3 w-56">Email</th>
                      <th className="px-4 py-3">Auditoría / Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredRows.map((entry) => {
                      const statusKey = (entry.errors.length > 0 ? "failed" : entry.status) as ImportStatus;
                      const meta = STATUS_META[statusKey] || STATUS_META.failed;
                      const Icon = meta.icon;
                      const hasIssues = entry.errors.length > 0 || entry.warnings.length > 0;

                      return (
                        <tr
                          key={entry.rowNumber}
                          className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
                        >
                          <td className="px-4 py-3.5 text-xs font-black text-[#111111] dark:text-white">
                            {entry.rowNumber}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] rounded",
                                meta.className
                              )}
                            >
                              <Icon className="size-3" />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-black text-[#111111] dark:text-white">
                            {entry.firstName} {entry.lastName}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-medium text-[#7a7f87] dark:text-[#a0a5ad]">
                            {entry.email}
                          </td>
                          <td className="px-4 py-3.5 text-xs">
                            {hasIssues ? (
                              <div className="space-y-1">
                                {entry.errors.map((err, i) => (
                                  <p key={i} className="text-red-600 dark:text-red-400 font-bold">
                                    • {err}
                                  </p>
                                ))}
                                {entry.warnings.map((warn, i) => (
                                  <p key={i} className="text-amber-600 dark:text-amber-400 font-semibold">
                                    • {warn}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#7a7f87] font-semibold">
                                {entry.status === "created"
                                  ? "Listo para registrar ficha y Firebase Auth"
                                  : entry.status === "updated"
                                  ? "Detectado ficha o Firebase, se actualizarán datos demográficos"
                                  : "Fila procesada exitosamente sin advertencias"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-16 text-center text-xs font-black uppercase tracking-[0.2em] text-[#7a7f87] dark:text-white/30"
                        >
                          {displayResult
                            ? "No se encontraron filas que coincidan con la búsqueda."
                            : "Sube un archivo y presiona Validar Lote para previsualizar los resultados."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : (
        /* HISTORIAL DE LOTES */
        <div className="space-y-6">
          {selectedBatch ? (
            /* BATCH ROW DETAIL VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setSelectedBatch(null)}
                    variant="outline"
                    size="sm"
                    className="h-8.5 uppercase text-[9px] tracking-[0.15em] font-black"
                  >
                    ← Volver
                  </Button>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-[#111111] dark:text-white">
                      Lote: {selectedBatch.file_name || selectedBatch.fileName}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a7f87]">
                      Ejecutado el {selectedBatch.created_at ? new Date(selectedBatch.created_at).toLocaleString("es-PE") : "---"} por {selectedBatch.created_by_email || "Sistema"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-3.5 text-[#7a7f87]" />
                    <input
                      type="text"
                      placeholder="Buscar en registros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8.5 pl-8.5 pr-4 border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] rounded text-xs focus:outline-none focus:border-[#d71920] w-52 font-medium text-[#111111] dark:text-white"
                    />
                  </div>
                  <Badge variant="success">Ejecutado con Éxito</Badge>
                </div>
              </div>

              {/* Stats Summary for this selected batch */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/10 p-4 rounded text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                    Creados
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {selectedBatch.createdCount}
                  </p>
                </div>
                <div className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/10 p-4 rounded text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                    Actualizados
                  </p>
                  <p className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-400">
                    {selectedBatch.updatedCount}
                  </p>
                </div>
                <div className="border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/10 p-4 rounded text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                    Omitidos
                  </p>
                  <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-400">
                    {selectedBatch.skippedCount}
                  </p>
                </div>
                <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/10 p-4 rounded text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-400">
                    Errores
                  </p>
                  <p className="mt-1 text-2xl font-black text-red-700 dark:text-red-400">
                    {selectedBatch.failedCount}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden border border-black/5 dark:border-white/5 bg-white dark:bg-[#151515] rounded">
                <div className="max-h-[500px] overflow-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="sticky top-0 bg-[#111111] dark:bg-[#1c1c1c] text-white">
                      <tr className="text-[9px] font-black uppercase tracking-[0.18em]">
                        <th className="px-4 py-3 w-16">Fila</th>
                        <th className="px-4 py-3 w-28">Estado</th>
                        <th className="px-4 py-3 w-44">Socio</th>
                        <th className="px-4 py-3 w-56">Email</th>
                        <th className="px-4 py-3">Detalle / Auditoría</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredRows.map((entry) => {
                        const statusKey = entry.status as ImportStatus;
                        const meta = STATUS_META[statusKey] || STATUS_META.failed;
                        const Icon = meta.icon;
                        const hasIssues = entry.errors.length > 0 || entry.warnings.length > 0;

                        return (
                          <tr
                            key={entry.rowNumber}
                            className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
                          >
                            <td className="px-4 py-3.5 text-xs font-black text-[#111111] dark:text-white">
                              {entry.rowNumber}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] rounded",
                                  meta.className
                                )}
                              >
                                <Icon className="size-3" />
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-black text-[#111111] dark:text-white">
                              {entry.firstName} {entry.lastName}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-medium text-[#7a7f87] dark:text-[#a0a5ad]">
                              {entry.email}
                            </td>
                            <td className="px-4 py-3.5 text-xs">
                              {hasIssues ? (
                                <div className="space-y-1">
                                  {entry.errors.map((err, i) => (
                                    <p key={i} className="text-red-600 dark:text-red-400 font-bold">
                                      • {err}
                                    </p>
                                  ))}
                                  {entry.warnings.map((warn, i) => (
                                    <p key={i} className="text-amber-600 dark:text-amber-400 font-semibold">
                                      • {warn}
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#7a7f87] font-semibold">
                                  {entry.status === "created"
                                    ? "Ficha y Firebase Auth registrados de forma exitosa"
                                    : entry.status === "updated"
                                    ? "Campos actualizados y sincronizados con Firebase"
                                    : "Operación de membresía salteada al ya contar con plan activo idéntico"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-16 text-center text-xs font-black uppercase tracking-[0.2em] text-[#7a7f87] dark:text-white/30"
                          >
                            No se encontraron registros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* HISTORY LIST VIEW */
            <div className="overflow-hidden border border-black/5 dark:border-white/5 bg-white dark:bg-[#151515] rounded shadow-xl shadow-black/[0.02]">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 p-5">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-[#111111] dark:text-white">
                    Historial de Lotes Ejecutados
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a7f87]">
                    Auditoría completa de migraciones masivas realizadas en el sistema.
                  </p>
                </div>
                <Button
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                  variant="outline"
                  size="sm"
                  className="h-8.5 uppercase text-[9px] tracking-[0.15em] font-black"
                >
                  <RefreshCw className={cn("size-3", loadingHistory && "animate-spin")} />
                  Refrescar Historial
                </Button>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-[#111111] dark:bg-[#1c1c1c] text-white">
                    <tr className="text-[9px] font-black uppercase tracking-[0.18em]">
                      <th className="px-5 py-3">Fecha y Hora</th>
                      <th className="px-5 py-3">Archivo CSV</th>
                      <th className="px-5 py-3">Operador</th>
                      <th className="px-5 py-3 text-center">Filas</th>
                      <th className="px-5 py-3 text-center">Métricas (C/A/O/E)</th>
                      <th className="px-5 py-3 text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {history.map((batch) => (
                      <tr
                        key={batch.id}
                        className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] text-xs font-bold text-[#111111] dark:text-white"
                      >
                        <td className="px-5 py-4 whitespace-nowrap text-[#7a7f87] dark:text-[#a0a5ad] font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-[#d71920]" />
                            {batch.created_at ? new Date(batch.created_at).toLocaleString("es-PE") : "---"}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-black">{batch.file_name}</td>
                        <td className="px-5 py-4 text-[#7a7f87] dark:text-[#a0a5ad] font-medium">
                          {batch.created_by_email || "Sistema"}
                        </td>
                        <td className="px-5 py-4 text-center font-black">{batch.total_rows}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-block border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">
                              {batch.createdCount}
                            </span>
                            <span className="inline-block border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-black">
                              {batch.updatedCount}
                            </span>
                            <span className="inline-block border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black">
                              {batch.skippedCount}
                            </span>
                            <span className="inline-block border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-black">
                              {batch.failedCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Button
                            onClick={() => loadBatchDetail(batch.id!)}
                            variant="secondary"
                            size="sm"
                            className="h-8 uppercase text-[9px] tracking-[0.15em] font-black"
                          >
                            <Eye className="size-3" />
                            Ver Lote
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {history.length === 0 && !loadingHistory && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center text-xs font-black uppercase tracking-[0.2em] text-[#7a7f87] dark:text-white/30"
                        >
                          Aún no se han ejecutado lotes de importación.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
