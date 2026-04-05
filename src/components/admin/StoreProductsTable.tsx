"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit3, ImageIcon } from "lucide-react";

import type { StoreDashboardProduct } from "@/lib/data/store";
import { formatProductPrice, formatUsdPrice, productStockStatusLabels } from "@/lib/data/products";
import { Badge } from "@/components/ui/badge";
import { deleteStoreProduct } from "@/app/(admin)/dashboard/tienda/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import DeleteStoreItemButton from "./DeleteStoreItemButton";
import { cn } from "@/lib/utils";

interface StoreProductsTableProps {
  products: StoreDashboardProduct[];
}

function getStockVariant(stockStatus: StoreDashboardProduct["stock_status"]) {
  switch (stockStatus) {
    case "in_stock":
      return "success" as const;
    case "low_stock":
      return "warning" as const;
    case "coming_soon":
    case "out_of_stock":
    default:
      return "muted" as const;
  }
}

export default function StoreProductsTable({ products }: Readonly<StoreProductsTableProps>) {
  if (products.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-black/10 bg-[#fbfbf8]">
        <p className="text-sm font-bold text-[#7a7f87] uppercase tracking-widest">No hay productos cargados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-black/5 hover:bg-black/5 border-none">
            <TableHead className="font-black text-[10px] uppercase text-[#111111] w-[80px]">Ref.</TableHead>
            <TableHead className="font-black text-[10px] uppercase text-[#111111]">Producto</TableHead>
            <TableHead className="font-black text-[10px] uppercase text-[#111111]">Precio Local</TableHead>
            <TableHead className="font-black text-[10px] uppercase text-[#111111]">PayPal USD</TableHead>
            <TableHead className="font-black text-[10px] uppercase text-[#111111]">Stock</TableHead>
            <TableHead className="font-black text-[10px] uppercase text-[#111111] text-right">Gestion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const hasDiscount = Boolean(product.compare_price);
            const mainImage = product.images?.[0];

            return (
              <TableRow key={product.id} className="group hover:bg-[#fbfbf8] transition-colors border-black/5">
                <TableCell>
                   <div className="relative h-14 w-14 border border-black/5 bg-black/5 flex items-center justify-center overflow-hidden">
                      {mainImage ? (
                        <Image 
                          src={mainImage} 
                          alt={product.name} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-black/10" />
                      )}
                   </div>
                </TableCell>
                <TableCell>
                  <div className="py-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/tienda/productos/${product.id}`}
                        className="text-sm font-bold text-[#111111] hover:text-[#d71920] transition-colors uppercase tracking-tight"
                      >
                        {product.name}
                      </Link>
                      {product.featured && (
                        <Badge variant="default" className="bg-amber-500 text-[7px] font-black h-4 px-1 rounded-none border-none">TOP</Badge>
                      )}
                      {!product.active && (
                        <Badge variant="muted" className="text-[7px] font-black h-4 px-1 rounded-none border-none">OFFLINE</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#7a7f87]">
                      {product.parent_category_name ?? "RAIZ"} <span className="text-black/10">/</span> {product.category_name ?? "SUB"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className={cn("text-sm font-bold text-[#111111]", hasDiscount && "text-[#d71920]")}>
                      {formatProductPrice(product)}
                    </p>
                    {product.compare_price && (
                      <p className="text-[10px] text-[#7a7f87] line-through font-medium">
                        {formatProductPrice({
                          price: product.compare_price,
                          currency: product.currency,
                        })}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-[11px] font-bold uppercase",
                      product.paypal_price_usd === null ? "text-amber-600" : "text-[#111111]"
                    )}>
                      {product.paypal_price_usd !== null
                        ? formatUsdPrice(product.paypal_price_usd)
                        : "No Habilitado"}
                    </span>
                    {product.paypal_price_usd === null && (
                      <span className="text-[8px] font-black text-amber-600/60 uppercase">Link PayPal</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStockVariant(product.stock_status)} className="text-[9px] font-black uppercase tracking-tighter">
                    {productStockStatusLabels[product.stock_status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/tienda/productos/${product.id}`}
                      className="p-2 text-[#7a7f87] hover:text-[#111111] hover:bg-black/5 transition-all"
                      title="Editar Producto"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <DeleteStoreItemButton id={product.id} onDelete={deleteStoreProduct} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
