type CheckoutTraceRoute = "paypal-init" | "paypal-complete";

type TraceContext = {
  route: CheckoutTraceRoute;
  cartId: string;
  orderId?: string | null;
  pickupRequestId?: string | null;
  userId?: string | null;
};

type TraceStepResult = {
  step: string;
  durationMs: number;
  ok: boolean;
  meta?: Record<string, unknown>;
};

function roundMs(durationMs: number) {
  return Math.round(durationMs * 100) / 100;
}

function nowMs() {
  return performance.now();
}

export function createCheckoutTrace(initialContext: TraceContext) {
  const startedAt = nowMs();
  const steps: TraceStepResult[] = [];
  let context = { ...initialContext };

  function setContext(nextContext: Partial<TraceContext>) {
    context = {
      ...context,
      ...nextContext,
    };
  }

  async function step<T>(
    stepName: string,
    runner: () => Promise<T>,
    getMeta?: (value: T) => Record<string, unknown> | undefined,
  ) {
    const stepStartedAt = nowMs();

    try {
      const value = await runner();
      const durationMs = roundMs(nowMs() - stepStartedAt);
      const meta = getMeta?.(value);

      steps.push({
        step: stepName,
        durationMs,
        ok: true,
        meta,
      });

      console.info(
        "[PayPal Checkout Trace]",
        JSON.stringify({
          ...context,
          step: stepName,
          durationMs,
          ok: true,
          meta,
        }),
      );

      return value;
    } catch (error) {
      const durationMs = roundMs(nowMs() - stepStartedAt);
      const message = error instanceof Error ? error.message : "fallo desconocido";

      steps.push({
        step: stepName,
        durationMs,
        ok: false,
        meta: {
          error: message,
        },
      });

      console.info(
        "[PayPal Checkout Trace]",
        JSON.stringify({
          ...context,
          step: stepName,
          durationMs,
          ok: false,
          error: message,
        }),
      );

      throw error;
    }
  }

  function flush(status: "success" | "error", extra?: Record<string, unknown>) {
    console.info(
      "[PayPal Checkout Trace]",
      JSON.stringify({
        ...context,
        status,
        totalDurationMs: roundMs(nowMs() - startedAt),
        steps,
        ...extra,
      }),
    );
  }

  return {
    setContext,
    step,
    flush,
  };
}
