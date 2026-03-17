"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthFeedbackDialogProps {
  variant: "registered" | "welcome";
}

export default function AuthFeedbackDialog({ variant }: Readonly<AuthFeedbackDialogProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramName = variant === "registered" ? "registered" : "welcome";
  const isOpen = searchParams.get(paramName) === "1";
  const email = searchParams.get("email");

  function handleOpenChange(open: boolean) {
    if (open) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(paramName);

    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl);
  }

  if (!isOpen) {
    return null;
  }

  const title =
    variant === "registered" ? "Cuenta creada correctamente" : "Bienvenida al area privada";
  const description =
    variant === "registered"
      ? `Tu cuenta ya existe${email ? ` para ${email}` : ""}. Revisa tu correo para confirmar el acceso y despues inicia sesion desde aqui.`
      : "Tu cuenta ya esta activa y has entrado correctamente. Aqui iremos habilitando futuras funciones privadas del gimnasio.";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Continuar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
