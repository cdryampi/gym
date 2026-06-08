"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteMemberAction } from "@/app/(admin)/dashboard/miembros/actions";
import { Button } from "@/components/ui/button";

interface DeleteMemberButtonProps {
  memberId: string;
  memberName: string;
}

export default function DeleteMemberButton({ memberId, memberName }: DeleteMemberButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Estas seguro de que deseas eliminar la ficha de "${memberName}"?\n\nEsta accion elimina la ficha operativa y, si tiene usuario vinculado no protegido, tambien elimina el usuario de Firebase para poder crearlo de nuevo.`,
    );

    if (!confirmed) return;

    const secondConfirmed = window.confirm(
      `Confirmacion final: eliminar "${memberName}"?\n\nEsta accion no se puede deshacer.`,
    );

    if (!secondConfirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteMemberAction(memberId);
      if (result.success) {
        toast.success("Ficha eliminada correctamente.");
        router.push("/dashboard/miembros");
        router.refresh();
      } else {
        toast.error(result.error ?? "No se pudo eliminar la ficha.");
      }
    } catch {
      toast.error("Error inesperado al eliminar la ficha.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="outline"
      disabled={isDeleting}
      onClick={handleDelete}
      className="h-12 px-6 font-black uppercase text-[10px] tracking-widest border-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 transition-all"
    >
      {isDeleting ? "Eliminando..." : "Eliminar Ficha"}
    </Button>
  );
}
