"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface MemberAuthFormProps {
  mode: "login" | "register";
}

function createMemberAuthSchema(mode: MemberAuthFormProps["mode"]) {
  return z
    .object({
      email: z.string().trim().email("Introduce un email valido."),
      password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
      confirmPassword:
        mode === "register"
          ? z.string().min(6, "Repite la contrasena.")
          : z.string().optional(),
    })
    .superRefine((values, context) => {
      if (mode === "register" && values.password !== values.confirmPassword) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Las contrasenas no coinciden.",
          path: ["confirmPassword"],
        });
      }
    });
}

type MemberAuthValues = z.infer<ReturnType<typeof createMemberAuthSchema>>;

export default function MemberAuthForm({ mode }: Readonly<MemberAuthFormProps>) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/mi-cuenta";
  const initialEmail = searchParams.get("email") || "";
  const isRegister = mode === "register";

  const form = useForm<MemberAuthValues>({
    resolver: zodResolver(createMemberAuthSchema(mode)),
    defaultValues: {
      email: initialEmail,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: MemberAuthValues) {
    setError(null);

    const supabase = createSupabaseBrowserClient();

    if (mode === "register") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        const completeParams = new URLSearchParams();
        completeParams.set("email", values.email);
        router.push(`/registro/completado?${completeParams.toString()}`);
        return;
      }

      const welcomeUrl = `${next}${next.includes("?") ? "&" : "?"}welcome=1`;
      router.push(welcomeUrl);
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{isRegister ? "Crea tu cuenta" : "Accede a tu cuenta"}</CardTitle>
        <CardDescription>
          {isRegister
            ? "Activa un acceso basico para futuras gestiones privadas del gimnasio."
            : "Entra con tu email y contrasena para ver tu espacio privado."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@email.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrasena</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimo 6 caracteres"
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isRegister ? (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repite la contrasena</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Vuelve a escribir tu contrasena"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isRegister ? "Crear cuenta" : "Entrar"}
            </Button>
          </form>
        </Form>

        <p className="mt-5 text-center text-sm text-[#5f6368]">
          {isRegister ? "¿Ya tienes cuenta?" : "¿Aun no tienes cuenta?"}{" "}
          <Link
            href={isRegister ? `/acceso?next=${encodeURIComponent(next)}` : `/registro?next=${encodeURIComponent(next)}`}
            className="font-semibold text-[#d71920]"
          >
            {isRegister ? "Accede aqui" : "Registrate aqui"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
