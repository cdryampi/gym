"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import type { StoreCategoryNode } from "@/lib/data/store";
import { Badge } from "@/components/ui/badge";
import { deleteStoreCategory } from "@/app/(admin)/dashboard/tienda/actions";

import AdminSurface from "./AdminSurface";
import DeleteStoreItemButton from "./DeleteStoreItemButton";

interface StoreCategoriesTableProps {
  categories: StoreCategoryNode[];
}

function renderNodeRows(node: StoreCategoryNode, depth = 0): ReactNode {
  return (
    <div key={node.id} className="space-y-3">
      <AdminSurface
        inset
        className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.1fr)_160px_120px_auto]"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="text-sm font-semibold text-[#111111]"
              style={{ paddingLeft: `${depth * 18}px` }}
            >
              {node.name}
            </p>
            {node.parent_id ? <Badge variant="muted">Subcategoria</Badge> : <Badge>Raiz</Badge>}
            {!node.active ? <Badge variant="warning">Inactiva</Badge> : null}
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7a7f87]">{node.slug}</p>
          {node.description ? (
            <p className="mt-2 text-sm leading-6 text-[#5f6368]">{node.description}</p>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7f87]">
            Orden
          </p>
          <p className="mt-2 text-sm font-semibold text-[#111111]">{node.order}</p>
        </div>

        <div className="flex items-start justify-end gap-2">
          <Link
            href={`/dashboard/tienda/categorias/${node.id}`}
            className="rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-[#111111] transition hover:border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Editar
          </Link>
          <DeleteStoreItemButton
            id={node.id}
            onDelete={deleteStoreCategory}
            confirmMessage="¿Eliminar categoría? No debe tener subcategorías ni productos."
          />
        </div>
      </AdminSurface>

      {node.children.map((child) => renderNodeRows(child, depth + 1))}
    </div>
  );
}

export default function StoreCategoriesTable({ categories }: Readonly<StoreCategoriesTableProps>) {
  if (categories.length === 0) {
    return (
      <AdminSurface inset className="p-5">
        <p className="text-sm font-semibold text-[#111111]">No hay categorias configuradas.</p>
        <p className="mt-2 text-sm leading-6 text-[#5f6368]">
          Crea una categoria raiz y despues añade sus subcategorias.
        </p>
      </AdminSurface>
    );
  }

  return <div className="space-y-3">{categories.map((category) => renderNodeRows(category))}</div>;
}
