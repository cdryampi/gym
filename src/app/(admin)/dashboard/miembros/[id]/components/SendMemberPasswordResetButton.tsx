"use client";

import { Mail, RotateCcw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { sendMemberPasswordResetAction } from "@/app/(admin)/dashboard/miembros/actions";
import { Button } from "@/components/ui/button";

export default function SendMemberPasswordResetButton({
  memberId,
}: Readonly<{
  memberId: string;
}>) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      variant="outline"
      className="h-12 px-6 border-black/10 bg-white font-black uppercase text-[10px] tracking-widest text-[#111111] hover:bg-[#111111] hover:text-white"
      onClick={() => {
        startTransition(async () => {
          const result = await sendMemberPasswordResetAction(memberId);

          if (result.success) {
            toast.success("Email de cambio de contrasena enviado.");
            return;
          }

          toast.error(result.error);
        });
      }}
    >
      {isPending ? <RotateCcw className="size-4 animate-spin" /> : <Mail className="size-4" />}
      Reset password
    </Button>
  );
}
