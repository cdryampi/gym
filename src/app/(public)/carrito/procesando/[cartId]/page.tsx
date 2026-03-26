import type { Metadata } from "next";

import CartProcessingPageClient from "@/components/cart/CartProcessingPageClient";

export const metadata: Metadata = {
  title: "Pago recibido",
  description: "Estamos terminando de registrar tu pedido pickup en Nova Forza.",
};

export const dynamic = "force-dynamic";

export default async function CartProcessingPage({
  params,
}: Readonly<{
  params: Promise<{ cartId: string }>;
}>) {
  const { cartId } = await params;

  return <CartProcessingPageClient cartId={cartId} />;
}
