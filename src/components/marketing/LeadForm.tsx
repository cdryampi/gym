"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactFormSchema, type ContactFormValues } from "@/lib/validators/contact";

export default function LeadForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Algo salió mal al enviar el mensaje.");
      }

      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Error inesperado.");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-white p-12 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-none bg-green-100 text-green-600">
          <Send className="h-8 w-8" />
        </div>
        <h3 className="mt-6 font-display text-2xl font-bold uppercase tracking-tight text-foreground">
          ¡Mensaje Enviado!
        </h3>
        <p className="mt-4 text-muted">
          Gracias por tu interés. Un asesor se pondrá en contacto contigo a la brevedad.
        </p>
        <Button
          variant="outline"
          className="mt-8 border-accent text-accent hover:bg-accent hover:text-white"
          onClick={() => setStatus("idle")}
        >
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-white p-10 shadow-2xl sm:p-12"
    >
      <div className="space-y-2">
        <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">
          Nombre completo
        </label>
        <Input
          id="name"
          placeholder="Ej: Juan Pérez"
          className="bg-[#f8f8f6] border-none h-14"
          {...register("name")}
        />
        {errors.name && <p className="text-xs font-medium text-accent">{errors.name.message}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="juan@email.com"
            className="bg-[#f8f8f6] border-none h-14"
            {...register("email")}
          />
          {errors.email && <p className="text-xs font-medium text-accent">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">
            Teléfono (Opcional)
          </label>
          <Input
            id="phone"
            placeholder="+54 9..."
            className="bg-[#f8f8f6] border-none h-14"
            {...register("phone")}
          />
          {errors.phone && <p className="text-xs font-medium text-accent">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50">
          Mensaje
        </label>
        <Textarea
          id="message"
          placeholder="Cuéntanos tus objetivos..."
          className="bg-[#f8f8f6] border-none min-h-[120px] resize-none"
          {...register("message")}
        />
        {errors.message && <p className="text-xs font-medium text-accent">{errors.message.message}</p>}
      </div>

      {status === "error" && (
        <p className="bg-accent/10 p-4 text-sm font-medium text-accent">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "loading"}
        className="btn-athletic btn-primary h-16 w-full text-base"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar solicitud de prueba"
        )}
      </Button>
    </form>
  );
}
