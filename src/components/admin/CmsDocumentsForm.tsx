"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, FileWarning, Loader2, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { saveCmsDocument } from "@/app/(admin)/dashboard/actions";
import AdminSurface from "@/components/admin/AdminSurface";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DBCmsDocument } from "@/lib/supabase/database.types";
import { cmsDocumentSchema, type CmsDocumentValues } from "@/lib/validators/cms-document";

function CmsDocumentEditorCard({
  document,
  disabledReason,
}: Readonly<{
  document: DBCmsDocument;
  disabledReason?: string;
}>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CmsDocumentValues>({
    resolver: zodResolver(cmsDocumentSchema),
    defaultValues: {
      key: document.key as CmsDocumentValues["key"],
      kind: document.kind as CmsDocumentValues["kind"],
      slug: document.slug,
      title: document.title,
      summary: document.summary,
      body_markdown: document.body_markdown,
      cta_label: document.cta_label ?? "",
      cta_href: document.cta_href ?? "",
      seo_title: document.seo_title,
      seo_description: document.seo_description,
      is_published: document.is_published,
    },
  });
  const watchedSlug = useWatch({ control: form.control, name: "slug" });

  function onSubmit(values: CmsDocumentValues) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveCmsDocument(values);
        setFeedback("Documento guardado.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar.");
      }
    });
  }

  const previewHref = document.kind === "legal" ? `/${document.slug}` : document.cta_href ?? "/";

  return (
    <AdminSurface className="space-y-5 border border-black/8 bg-[#fbfbf8] p-5">
      <div className="flex flex-col gap-3 border-b border-black/8 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#d71920]">
            {document.key}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#111111]">{document.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#5f6368]">
            {document.kind === "legal"
              ? "Documento publico con URL propia, SEO y CTA opcional."
              : "Texto de sistema reutilizable para cookies, errores y estados fallback."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f6368]">
            {document.kind === "legal" ? <ShieldCheck className="h-3.5 w-3.5" /> : <FileWarning className="h-3.5 w-3.5" />}
            {document.kind === "legal" ? "Legal" : "Sistema"}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href={previewHref} target={document.kind === "legal" ? undefined : "_blank"}>
              <ExternalLink className="h-4 w-4" />
              Vista previa
            </Link>
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {document.kind === "legal"
                      ? `Ruta publica: /${watchedSlug || document.slug}`
                      : "Identificador URL interno para soporte y preview."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumen</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="body_markdown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contenido (markdown simple)</FormLabel>
                <FormControl>
                  <Textarea rows={10} {...field} className="font-mono text-sm" />
                </FormControl>
                <FormDescription>
                  Usa titulos con #, listas con - y parrafos simples. No hay editor visual en este MVP.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cta_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA label</FormLabel>
                  <FormControl>
                    <Input placeholder="Volver al inicio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cta_href"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA href</FormLabel>
                  <FormControl>
                    <Input placeholder="/cookies o https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="seo_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seo_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 rounded-none border border-black/8 bg-white p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#d71920]"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Publicado</FormLabel>
                  <FormDescription>
                    Solo los documentos publicados se exponen en la web publica y en las pantallas de error.
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#5f6368]" aria-live="polite">
              {isPending
                ? "Guardando documento..."
                : feedback ?? disabledReason ?? "Edita el contenido y guarda para publicarlo."}
            </p>
            <Button type="submit" disabled={isPending || Boolean(disabledReason)}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar documento
            </Button>
          </div>
        </form>
      </Form>
    </AdminSurface>
  );
}

export default function CmsDocumentsForm({
  documents,
  disabledReason,
}: Readonly<{
  documents: DBCmsDocument[];
  disabledReason?: string;
}>) {
  const legalDocuments = documents.filter((document) => document.kind === "legal");
  const systemDocuments = documents.filter((document) => document.kind === "system");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
            Legales
          </p>
          <p className="mt-1 text-sm text-[#5f6368]">
            Paginas publicas para privacidad, cookies, terminos, desistimiento y aviso legal.
          </p>
        </div>
        <div className="grid gap-5">
          {legalDocuments.map((document) => (
            <CmsDocumentEditorCard
              key={document.key}
              document={document}
              disabledReason={disabledReason}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
            Sistema
          </p>
          <p className="mt-1 text-sm text-[#5f6368]">
            Banner de cookies y copys genericos para errores, 404 y acceso restringido.
          </p>
        </div>
        <div className="grid gap-5">
          {systemDocuments.map((document) => (
            <CmsDocumentEditorCard
              key={document.key}
              document={document}
              disabledReason={disabledReason}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
