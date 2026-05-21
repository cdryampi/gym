"use client";

import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { normalizeCommerceImageUrl } from "@/lib/commerce/image-urls";
import { uploadAdminMedia } from "@/lib/media/admin-upload";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  value = [],
  onChange,
  disabled,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFeedback(null);
    const newUrls = [...value];

    try {
      for (const file of Array.from(files)) {
        const uploadedImage = await uploadAdminMedia(file, "product");
        newUrls.push(uploadedImage.url);
      }

      onChange(newUrls);
    } catch (error) {
      console.error("Error in upload process:", error);
      setFeedback(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const onRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url) => {
          const displayUrl = normalizeCommerceImageUrl(url) ?? "/images/products/product-1.png";

          return (
            <div
              key={url}
              className="relative aspect-square overflow-hidden border border-black/10 bg-black/[0.02]"
            >
              <Image
                src={displayUrl}
                alt="Producto"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 12rem, (min-width: 640px) 20vw, 45vw"
              />
              <button
                onClick={() => onRemove(url)}
                disabled={disabled}
                className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center bg-white shadow-sm hover:text-[#d71920] disabled:opacity-50"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        <label
          className={cn(
            "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-black/10 transition-colors hover:border-[#d71920]/40 hover:bg-[#fff7f7]",
            (disabled || isUploading) && "pointer-events-none opacity-50",
          )}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUpload}
            className="sr-only"
            disabled={disabled || isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-black/40" />
          ) : (
            <Upload className="h-6 w-6 text-black/40" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-black/40">
            {isUploading ? "Subiendo..." : "Subir imagen"}
          </span>
        </label>
      </div>

      {value.length === 0 && !isUploading ? (
        <p className="text-xs text-[#5f6368]">
          No hay imagenes seleccionadas. Las nuevas subidas se optimizan para la web antes de guardarse.
        </p>
      ) : null}

      {feedback ? <p className="text-xs text-[#d71920]">{feedback}</p> : null}
    </div>
  );
}
