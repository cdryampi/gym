"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";

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
import { syncFirebaseBrowserSession } from "@/lib/firebase/browser-session";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";

const loginSchema = z.object({
  identity: z.string().trim().min(2, "Introduce un email o usuario valido."),
  password: z.string().min(4, "La contrasena es obligatoria."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "admin-only"
      ? "Esta cuenta no tiene acceso al backoffice."
      : null,
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const next = searchParams.get("next") || "/dashboard";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identity: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setError(null);
    setIsNavigating(false);

    try {
      if (!values.identity.includes("@")) {
        const response = await fetch("/api/dev-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "No se pudo iniciar sesion local.");
          return;
        }

        setIsNavigating(true);
        router.push(next);
        router.refresh();
        return;
      }

      const auth = await getFirebaseBrowserAuth();

      if (!auth) {
        setError("Firebase Auth no esta configurado.");
        return;
      }

      await signInWithEmailAndPassword(auth, values.identity, values.password);
      await syncFirebaseBrowserSession(auth);

      setIsNavigating(true);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(getFirebaseErrorMessage(err, "No se pudo iniciar sesion."));
      setIsNavigating(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      {isNavigating ? (
        <AuthBlockingState
          title="Preparando tu panel"
          body="El acceso ya fue validado. Estamos comprobando permisos y cargando el dashboard."
        />
      ) : null}
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso al backoffice</CardTitle>
          <CardDescription>
            Usa una cuenta con acceso persistente al dashboard o, en local, las credenciales de entorno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="identity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email o usuario</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="admin@gym-local.test o admin"
                        autoComplete="username"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrasena</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="********"
                        autoComplete="current-password"
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
                  title="No se pudo iniciar sesion"
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
                  pendingLabel={isNavigating ? "Preparando panel" : "Validando acceso"}
                >
                  Entrar
                </PendingButtonLabel>
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
