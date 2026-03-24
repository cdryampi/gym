import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "El flujo pickup directo ya no esta disponible. Prepara el pago con PayPal y completa el checkout nativo del carrito.",
    },
    { status: 410 },
  );
}
