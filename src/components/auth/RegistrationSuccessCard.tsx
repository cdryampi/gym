"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const REDIRECT_SECONDS = 8;

interface RegistrationSuccessCardProps {
  email?: string | null;
}

export default function RegistrationSuccessCard({
  email = null,
}: Readonly<RegistrationSuccessCardProps>) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      router.replace("/");
    }, REDIRECT_SECONDS * 1000);

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [router]);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Cuenta creada con exito</CardTitle>
        <CardDescription>
          Ya hemos preparado tu acceso. El siguiente paso es confirmar tu correo para activar la
          cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-black/8 bg-[#fbfbf8] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
            Email registrado
          </p>
          <p className="mt-2 text-lg font-semibold text-[#111111]">
            {email ?? "Revisa tu bandeja de entrada"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[#5f6368]">
            Busca el correo de confirmacion, abre el enlace y despues podras entrar con normalidad.
          </p>
        </div>

        <div className="rounded-2xl border border-[#d71920]/12 bg-[#fff5f5] p-5 text-sm leading-7 text-[#5f6368]">
          Te llevaremos automaticamente a la home en <strong className="text-[#111111]">{secondsLeft}</strong>{" "}
          segundos.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={email ? `/acceso?email=${encodeURIComponent(email)}` : "/acceso"}>
              Ir a acceso
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
