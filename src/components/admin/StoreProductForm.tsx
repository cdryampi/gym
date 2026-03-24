"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { saveStoreProduct } from "@/app/(admin)/dashboard/tienda/actions";
import { productStockStatusLabels } from "@/lib/data/products";
import {
  flattenStoreCategoryOptions,
  toStoreProductFormValues,
  type StoreCategory,
  type StoreDashboardProduct,
} from "@/lib/data/store";
import { storeProductSchema, type StoreProductInput } from "@/lib/validators/store";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import AdminSurface from "./AdminSurface";
import ImageUpload from "./ImageUpload";

interface StoreProductFormProps {
  product?: StoreDashboardProduct | null;
  categories: StoreCategory[];
  disabledReason?: string;
}

export default function StoreProductForm({
  product,
  categories,
  disabledReason,
}: Readonly<StoreProductFormProps>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StoreProductInput>({
    resolver: zodResolver(storeProductSchema),
    defaultValues: toStoreProductFormValues(product),
  });

  const categoryOptions = flattenStoreCategoryOptions(categories);

  function onSubmit(values: StoreProductInput) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveStoreProduct(values, product?.id);
        setFeedback(product ? "Producto actualizado." : "Producto creado.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Error al guardar.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="Se autogenera si lo dejas vacio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategoria</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-11 w-full rounded-none border border-black/10 bg-white px-3 text-sm text-[#111111]"
                  >
                    <option value="">Selecciona categoria...</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.depth > 0 ? "— " : ""}{option.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eyebrow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Eyebrow</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion corta</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion completa</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 md:grid-cols-5">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio real</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    {...field}
                    value={typeof field.value === "number" ? field.value : 0}
                    onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paypal_price_usd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio estimado PayPal (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      typeof field.value === "number" || typeof field.value === "string"
                        ? field.value
                        : ""
                    }
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="compare_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compare price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      typeof field.value === "number" || typeof field.value === "string"
                        ? field.value
                        : ""
                    }
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <FormControl>
                  <Input maxLength={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={typeof field.value === "number" ? field.value : 0}
                    onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="discount_label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiqueta de descuento</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cta_label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="stock_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-11 w-full rounded-none border border-black/10 bg-white px-3 text-sm text-[#111111]"
                  >
                    {Object.entries(productStockStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pickup_only"
            render={({ field }) => (
              <FormItem>
                <label className="mt-8 flex items-center gap-3 text-sm font-medium text-[#111111]">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Solo recogida local
                </label>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="pickup_note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota de recogida</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="pickup_summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titular de recogida</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pickup_eta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto ETA</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <AdminSurface className="p-6">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-black/40">
            Contenido y Detalles
          </h3>
          <div className="grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="images_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagenes del producto</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ? field.value.split("\n").filter(Boolean) : []}
                        onChange={(urls) => field.onChange(urls.join("\n"))}
                        disabled={isPending || Boolean(disabledReason)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specifications_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especificaciones (Label: Valor)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tags_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (una por linea)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="highlights_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highlights (uno por linea)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="benefits_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficios (uno por linea)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usage_steps_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pasos de uso (uno por linea)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </AdminSurface>

        <div className="grid gap-5 md:grid-cols-3">
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-center gap-3 text-sm font-medium text-[#111111]">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Producto destacado
                </label>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-center gap-3 text-sm font-medium text-[#111111]">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Producto activo
                </label>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <AdminSurface className="sticky bottom-4 z-10 border-black/10 bg-white/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#5f6368]">{feedback ?? disabledReason}</p>
            <Button type="submit" disabled={isPending || Boolean(disabledReason)}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar producto
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
