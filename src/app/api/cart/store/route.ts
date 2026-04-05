import { NextResponse } from "next/server";

import {
  addCartLineItem,
  createCart,
  deleteCartLineItem,
  retrieveCart,
  updateCartEmail,
  updateCartLineItem,
} from "@/lib/cart/medusa";

type CartStoreAction =
  | {
      action: "create";
      email?: string | null;
    }
  | {
      action: "add-item";
      cartId: string;
      quantity: number;
      variantId: string;
    }
  | {
      action: "update-item";
      cartId: string;
      lineItemId: string;
      quantity: number;
    }
  | {
      action: "delete-item";
      cartId: string;
      lineItemId: string;
    }
  | {
      action: "update-email";
      cartId: string;
      email: string;
    };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get("cartId");

  if (!cartId) {
    return NextResponse.json({ error: "Falta cartId para recuperar el carrito." }, { status: 400 });
  }

  try {
    const cart = await retrieveCart(cartId);
    return NextResponse.json({ cart });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo recuperar el carrito.") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<CartStoreAction>;

  try {
    switch (body.action) {
      case "create": {
        const cart = await createCart(body.email ?? null);
        return NextResponse.json({ cart });
      }

      case "add-item": {
        const cart = await addCartLineItem(body.cartId ?? "", body.variantId ?? "", body.quantity ?? 1);
        return NextResponse.json({ cart });
      }

      case "update-item": {
        const cart = await updateCartLineItem(
          body.cartId ?? "",
          body.lineItemId ?? "",
          body.quantity ?? 1,
        );
        return NextResponse.json({ cart });
      }

      case "delete-item": {
        const cart = await deleteCartLineItem(body.cartId ?? "", body.lineItemId ?? "");
        return NextResponse.json({ cart });
      }

      case "update-email": {
        const cart = await updateCartEmail(body.cartId ?? "", body.email ?? "");
        return NextResponse.json({ cart });
      }

      default:
        return NextResponse.json({ error: "Accion de carrito no valida." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "No se pudo completar la operacion del carrito.") },
      { status: 500 },
    );
  }
}
