"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { confirmPasswordReset } from "firebase/auth";

import PublicInlineAlert from "@/components/public/PublicInlineAlert";
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
import { AuthBlockingState, PendingButtonLabel } from "@/components/ui/loading-state";
import { getFirebaseBrowserAuth } from "@/lib/firebase/client";

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
    confirmPassword: z.string().min(6, "Repite la contrasena."),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las contrasenas no coinciden.",
        path: ["confirmPassword"],
      });
    }
  });

type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onTouched",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: UpdatePasswordValues) {
    setError(null);
    setSuccess(false);

    if (!oobCode) {
      setError("El enlace de recuperacion no es valido o ya caducado.");
      return;
    }

    const auth = await getFirebaseBrowserAuth();

    if (!auth) {
      setError("Firebase Auth no esta configurado.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, values.password);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No pudimos actualizar la contrasena.");
      return;
    }

    setSuccess(true);
    window.setTimeout(() => {
      setIsNavigating(true);
      router.push("/acceso?confirmed=1");
    }, 1500);
  }

  if (success) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Contrasena actualizada</CardTitle>
          <CardDescription>
            Tu acceso ya ha sido actualizado con la nueva contrasena. Ya puedes entrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-none border border-emerald-200 bg-emerald-50/50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Cambio completado
            </p>
            <p className="mt-2 text-lg font-semibold text-[#111111]">Nueva contrasena lista</p>
            <p className="mt-3 text-sm leading-7 text-[#476058]">
              Hemos guardado tus nuevas credenciales correctamente. Te estamos redirigiendo a la pantalla de acceso para que entres con normalidad.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/acceso?confirmed=1">Acceder ahora</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      {form.formState.isSubmitting || isNavigating ? (
        <AuthBlockingState
          eyebrow="Actualizacion"
          title="Guardando cambios"
          body="Estamos registrando tu nueva contrasena de forma segura en el sistema."
        />
      ) : null}
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Nueva contrasena</CardTitle>
          <CardDescription>Elige una contrasena segura para tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                        autoComplete="new-password"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error ? (
                <PublicInlineAlert
                  tone="error"
                  title="No pudimos actualizar la contrasena"
                  message={error}
                  compact
                />
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || isNavigating}
              >
                <PendingButtonLabel
                  pending={form.formState.isSubmitting || isNavigating}
                  pendingLabel="Actualizando contrasena"
                >
                  Actualizar contrasena
                </PendingButtonLabel>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
