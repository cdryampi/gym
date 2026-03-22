import type { Metadata } from "next";

import CartPageClient from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "Carrito del gimnasio",
  description:
    "Revisa tu seleccion de suplementos, accesorios y merchandising antes de solicitar la recogida en Nova Forza.",
};

export default function CartPage() {
  return <CartPageClient />;
}
