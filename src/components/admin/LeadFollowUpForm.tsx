"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { saveLeadFollowUp } from "@/app/(admin)/dashboard/actions";
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
import { formatDateTimeLocalInput } from "@/lib/topbar";
import type { Lead } from "@/lib/supabase/database.types";
import { leadFollowUpSchema, type LeadFollowUpValues } from "@/lib/validators/lead";

interface LeadFollowUpFormProps {
  lead: Pick<Lead, "id" | "contacted_at" | "channel" | "outcome" | "next_step">;
  disabledReason?: string;
}

function getDefaultValues(lead: LeadFollowUpFormProps["lead"]): LeadFollowUpValues {
  return {
    contacted_at: formatDateTimeLocalInput(lead.contacted_at),
    channel: lead.channel ?? "",
    outcome: lead.outcome ?? "",
    next_step: lead.next_step ?? "",
  };
}

export default function LeadFollowUpForm({ lead, disabledReason }: LeadFollowUpFormProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LeadFollowUpValues>({
    resolver: zodResolver(leadFollowUpSchema),
    defaultValues: getDefaultValues(lead),
  });

  useEffect(() => {
    form.reset(getDefaultValues(lead));
  }, [form, lead]);

  function onSubmit(values: LeadFollowUpValues) {
    setFeedback(null);

    startTransition(async () => {
      try {
        await saveLeadFollowUp(lead.id, values);
        form.reset(values);
        setFeedback("Seguimiento guardado.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar el seguimiento.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="contacted_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ultimo contacto</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <FormControl>
                  <Input placeholder="WhatsApp, llamada, email..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="outcome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resultado</FormLabel>
              <FormControl>
                <Input placeholder="Pidio precios, visita agendada, sin respuesta..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="next_step"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Siguiente paso</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Ejemplo: volver a escribir el jueves con opciones del plan Progreso."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Mantiene el seguimiento minimo del lead sin convertir esta vista en un CRM pesado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6368]" aria-live="polite">
            {isPending
              ? "Guardando seguimiento..."
              : feedback ?? disabledReason ?? "Registra solo lo esencial para la siguiente accion comercial."}
          </p>
          <Button type="submit" disabled={isPending || Boolean(disabledReason)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar seguimiento
          </Button>
        </div>
      </form>
    </Form>
  );
}
