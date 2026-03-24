"use client";

import { useRef, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

interface PayPalCheckoutButtonProps {
  clientId: string;
  currencyCode: string;
  orderId: string;
  disabled?: boolean;
  onApproveCheckout: () => Promise<void>;
  onCancel?: () => void;
  onError?: (message: string) => void;
}

function getPayPalErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "PayPal no pudo continuar con el pago.";
}

export default function PayPalCheckoutButton({
  clientId,
  currencyCode,
  orderId,
  disabled = false,
  onApproveCheckout,
  onCancel,
  onError,
}: Readonly<PayPalCheckoutButtonProps>) {
  const [isPending, setIsPending] = useState(false);
  const approvalStartedRef = useRef(false);

  return (
    <div className="space-y-4">
      <PayPalScriptProvider
        options={{
          clientId,
          currency: currencyCode,
          intent: "capture",
          components: "buttons",
        }}
      >
        <PayPalButtons
          disabled={disabled || isPending}
          forceReRender={[orderId, currencyCode, disabled, isPending]}
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
          }}
          createOrder={async () => orderId}
          onApprove={async () => {
            if (approvalStartedRef.current) {
              return;
            }

            approvalStartedRef.current = true;
            setIsPending(true);
            try {
              await onApproveCheckout();
            } catch (error) {
              approvalStartedRef.current = false;
              setIsPending(false);
              throw error;
            }
          }}
          onCancel={() => {
            approvalStartedRef.current = false;
            onCancel?.();
          }}
          onError={(error) => {
            approvalStartedRef.current = false;
            setIsPending(false);
            onError?.(getPayPalErrorMessage(error));
          }}
        />
      </PayPalScriptProvider>

      {isPending && (
        <div className="flex items-center justify-center gap-3 py-2 text-sm font-medium text-emerald-700 animate-pulse">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
          Procesando tu pedido...
        </div>
      )}
    </div>
  );
}
