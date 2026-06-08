"use client";

import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { uploadAdminMedia } from "@/lib/media/admin-upload";
import { cn } from "@/lib/utils";

interface MarketingTeamImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function MarketingTeamImageUpload({
  value,
  onChange,
  disabled,
}: Readonly<MarketingTeamImageUploadProps>) {
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const uploadedImage = await uploadAdminMedia(file, "team");
      onChange(uploadedImage.url);
    } catch (error) {
      console.error("[MarketingTeamImageUpload] Upload error:", error);
      setFeedback(error instanceof Error ? error.message : "No se pudo subir la foto.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative aspect-[3/4] w-28 overflow-hidden border border-black/10 bg-black/[0.03]",
          !value && "grid place-items-center",
        )}
      >
        {value ? (
          <Image
            src={value}
            alt="Entrenador"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 7rem, 28vw"
          />
        ) : (
          <div className="px-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#8c9198]">
            Sin foto subida
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-[#111111]",
            (disabled || isUploading) && "pointer-events-none opacity-50",
          )}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={disabled || isUploading}
          />
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {value ? "Reemplazar foto" : "Subir foto"}
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || isUploading || !value}
          onClick={() => onChange("")}
        >
          <Trash2 className="h-4 w-4" />
          Quitar
        </Button>
      </div>

      <p className="text-[11px] text-[#7a7f87]">
        La imagen se optimiza para la web antes de guardarse en nuestro servidor seguro.
      </p>
      {feedback ? <p className="text-[11px] text-[#d71920]">{feedback}</p> : null}
    </div>
  );
}
