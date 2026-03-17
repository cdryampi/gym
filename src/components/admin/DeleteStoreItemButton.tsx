"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteStoreItemButtonProps {
  id: string;
  onDelete: (id: string) => Promise<void>;
  label?: string;
  className?: string;
  confirmMessage?: string;
}

export default function DeleteStoreItemButton({
  id,
  onDelete,
  label,
  className,
  confirmMessage = "¿Estás seguro de que deseas eliminar este elemento?",
}: DeleteStoreItemButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDelete = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      setTimeout(() => setIsConfirming(false), 3000); // Reset after 3s
      return;
    }

    startTransition(async () => {
      try {
        await onDelete(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Error al eliminar");
        setIsConfirming(false);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
        isConfirming
          ? "bg-red-600 text-white hover:bg-red-700"
          : "border border-black/8 text-[#111111] hover:border-red-600 hover:text-red-600",
        isPending && "opacity-50 grayscale cursor-not-allowed",
        className
      )}
      title={isConfirming ? confirmMessage : "Eliminar"}
    >
      <Trash2 className="h-4 w-4" />
      {label && <span>{isConfirming ? "Confirmar" : label}</span>}
      {!label && isConfirming && <span>Confirmar</span>}
    </button>
  );
}
