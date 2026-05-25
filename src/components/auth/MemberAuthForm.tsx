"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

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
import {
  buildMemberRegistrationCompleteUrl,
} from "@/lib/member-auth-flow";
import { clearFirebaseBrowserSession, syncFirebaseBrowserSession } from "@/lib/firebase/browser-session";
import { getFirebaseBrowserAuth } from "@/lib/firebase/client";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/mi-cuenta";
  const initialEmail = searchParams.get("email") || "";
  const isConfirmed = searchParams.get("confirmed") === "1";
  const isRegister = mode === "register";

  const form = useForm<MemberAuthValues>({
    resolver: zodResolver(createMemberAuthSchema(mode)),
    defaultValues: {
      email: initialEmail,
      password: "",
      confirmPassword: "",
    },
  });

  function triggerWelcomeEmail(email: string) {
    void fetch("/api/auth/welcome", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    }).catch(() => {
      // El registro no depende del email de bienvenida.
    });
  }

  async function onSubmit(values: MemberAuthValues) {
    setError(null);
    setIsNavigating(false);

    const auth = await getFirebaseBrowserAuth();

    if (!auth) {
      setError("Firebase Auth no esta configurado.");
      return;
    }

    if (mode === "register") {
      try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        await syncFirebaseBrowserSession(auth);
      } catch (error) {
        setError(error instanceof Error ? error.message : "No pudimos crear tu cuenta.");
        return;
      }

      try {
        await fetch("/api/auth/email-verification", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email: values.email,
            next: buildMemberRegistrationCompleteUrl({
              confirmed: true,
            }),
          }),
        });
        triggerWelcomeEmail(values.email);
      } catch (error) {
        setError(error instanceof Error ? error.message : "No pudimos enviar el correo de confirmacion.");
        return;
      }

      await signOut(auth).catch(() => undefined);
      await clearFirebaseBrowserSession();
      setIsNavigating(true);
      router.push(
        buildMemberRegistrationCompleteUrl({
          email: values.email,
          pending: true,
        }),
      );
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await syncFirebaseBrowserSession(auth);

      if (!credential.user.emailVerified) {
        await signOut(auth).catch(() => undefined);
        await clearFirebaseBrowserSession();
        setIsNavigating(true);
        router.push(
          buildMemberRegistrationCompleteUrl({
            email: values.email,
            pending: true,
          }),
        );
        return;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "No pudimos iniciar sesion.");
      return;
    }

    setIsNavigating(true);
    router.push(next);
    router.refresh();
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      {isNavigating ? (
        <AuthBlockingState
          eyebrow={isRegister ? "Creando acceso" : "Validando acceso"}
          title={isRegister ? "Preparando tu cuenta" : "Cargando tu espacio"}
          body={
            isRegister
              ? "La cuenta ya fue aceptada. Estamos preparando la pantalla final del alta."
              : "Las credenciales son correctas. Estamos abriendo tu espacio privado."
          }
        />
      ) : null}
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
                    <Input type="email" placeholder="tu@email.com" autoComplete="email" required {...field} />
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
                      required
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
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {error ? (
              <PublicInlineAlert
                tone="error"
                title={isRegister ? "No pudimos crear tu cuenta" : "No pudimos iniciar sesion"}
                message={error}
                compact
              />
            ) : null}

            {!isRegister && isConfirmed ? (
              <PublicInlineAlert
                tone="success"
                title="Correo confirmado"
                message="Tu cuenta ya quedo verificada. Entra con tu email y contrasena para abrir tu espacio privado."
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
                pendingLabel={
                  isNavigating
                    ? isRegister
                      ? "Preparando acceso"
                      : "Cargando tu espacio"
                    : isRegister
                      ? "Creando cuenta"
                      : "Validando acceso"
                }
              >
                {isRegister ? "Crear cuenta" : "Entrar"}
              </PendingButtonLabel>
            </Button>
            </form>
          </Form>

          <p className="mt-5 text-center text-sm text-[#5f6368]">
            {isRegister ? "Ya tienes cuenta?" : "Aun no tienes cuenta?"}{" "}
            <Link
              href={
                isRegister
                  ? `/acceso?next=${encodeURIComponent(next)}`
                  : `/registro?next=${encodeURIComponent(next)}`
              }
              className="font-semibold text-[#d71920]"
            >
              {isRegister ? "Accede aqui" : "Registrate aqui"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
