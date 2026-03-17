"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { saveStoreCategory } from "@/app/(admin)/dashboard/tienda/actions";
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
import {
  toStoreCategoryFormValues,
  type StoreCategory,
} from "@/lib/data/store";
import { storeCategorySchema, type StoreCategoryInput } from "@/lib/validators/store";

import AdminSurface from "./AdminSurface";

interface StoreCategoryFormProps {
  category?: StoreCategory | null;
  categories: StoreCategory[];
  disabledReason?: string;
}

export default function StoreCategoryForm({
  category,
  categories,
  disabledReason,
}: Readonly<StoreCategoryFormProps>) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StoreCategoryInput>({
    resolver: zodResolver(storeCategorySchema),
    defaultValues: toStoreCategoryFormValues(category),
  });

  const parentOptions = categories.filter(
    (entry) => entry.parent_id == null && entry.id !== category?.id,
  );

  function onSubmit(values: StoreCategoryInput) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await saveStoreCategory(values, category?.id);
        setFeedback(category ? "Categoria actualizada." : "Categoria creada.");
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria padre</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-11 w-full rounded-none border border-black/10 bg-white px-3 text-sm text-[#111111]"
                  >
                    <option value="">Sin padre (categoria raiz)</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
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
                Categoria activa
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <AdminSurface className="sticky bottom-4 z-10 border-black/10 bg-white/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#5f6368]">{feedback ?? disabledReason}</p>
            <Button type="submit" disabled={isPending || Boolean(disabledReason)}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar categoria
            </Button>
          </div>
        </AdminSurface>
      </form>
    </Form>
  );
}
