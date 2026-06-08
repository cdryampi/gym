"use client";

import { KeyRound, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { grantMemberWebAccessAction } from "@/app/(admin)/dashboard/miembros/actions";
import { Button } from "@/components/ui/button";

export default function GrantMemberWebAccessButton({
  memberId,
}: Readonly<{
  memberId: string;
}>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      variant="outline"
      className="h-12 border-emerald-200 bg-emerald-50 px-6 font-black uppercase text-[10px] tracking-widest text-emerald-700 hover:bg-emerald-600 hover:text-white"
      onClick={() => {
        startTransition(async () => {
          const result = await grantMemberWebAccessAction(memberId);

          if (result.success) {
            toast.success(
              result.firebaseAction === "created"
                ? "Acceso web creado. Email para definir contrasena enviado."
                : "Acceso web vinculado. Email para definir contrasena enviado.",
            );
            router.refresh();
            return;
          }

          toast.error(result.error);
        });
      }}
    >
      {isPending ? <RotateCcw className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
      Dar acceso web
    </Button>
  );
}
