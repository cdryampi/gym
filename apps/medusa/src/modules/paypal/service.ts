import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  BigNumberInput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrderStatus,
  OrdersController,
  PaymentsController,
} from "@paypal/paypal-server-sdk"

import type { PayPalModuleOptions } from "./types"
import {
  assertPayPalCurrencySupported,
  toPayPalMedusaError,
} from "./error-utils"

type InjectedDependencies = {
  logger: Logger
}

type PayPalPaymentData = Record<string, unknown> & {
  order_id?: string
  authorization_id?: string
  capture_id?: string
  session_id?: string
  currency_code?: string
  charge_currency_code?: string
  charge_amount?: number
  display_currency_code?: string
  display_amount?: number
  exchange_rate?: number
  exchange_rate_source?: string
  exchange_rate_reference?: string
  intent?: string
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function getPayPalCaptureAmountValue(resource: Record<string, unknown> | null) {
  const purchaseUnits = Array.isArray(resource?.purchase_units) ? resource.purchase_units : []
  const firstPurchaseUnit = asRecord(purchaseUnits[0])
  const payments = asRecord(firstPurchaseUnit?.payments)
  const captures = Array.isArray(payments?.captures) ? payments.captures : []
  return asString(asRecord(captures[0])?.amount && asRecord(asRecord(captures[0])?.amount)?.value)
}

class PayPalPaymentProviderService extends AbstractPaymentProvider<PayPalModuleOptions> {
  static identifier = "paypal"

  protected logger_: Logger
  protected options_: Required<
    Pick<PayPalModuleOptions, "client_id" | "client_secret" | "environment" | "autoCapture">
  > &
    Pick<PayPalModuleOptions, "webhook_id" | "region_id" | "region_name">
  protected client_: Client
  protected ordersController_: OrdersController
  protected paymentsController_: PaymentsController

  static validateOptions(options: Record<string, unknown>) {
    if (!options.client_id || typeof options.client_id !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal provider requires client_id."
      )
    }

    if (!options.client_secret || typeof options.client_secret !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal provider requires client_secret."
      )
    }
  }

  constructor(container: InjectedDependencies, options: PayPalModuleOptions) {
    super(container, options)

    this.logger_ = container.logger
    this.options_ = {
      environment: "sandbox",
      autoCapture: true,
      ...options,
      client_id: options.client_id,
      client_secret: options.client_secret,
    }

    this.client_ = new Client({
      environment:
        this.options_.environment === "production"
          ? Environment.Production
          : Environment.Sandbox,
      clientCredentialsAuthCredentials: {
        oAuthClientId: this.options_.client_id,
        oAuthClientSecret: this.options_.client_secret,
      },
    })

    this.ordersController_ = new OrdersController(this.client_)
    this.paymentsController_ = new PaymentsController(this.client_)
  }

  protected getBaseApiUrl() {
    return this.options_.environment === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com"
  }

  protected formatAmount(amount: BigNumberInput) {
    const normalizedAmount = Number(amount) / 100

    if (!Number.isFinite(normalizedAmount)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `PayPal amount '${String(amount)}' is invalid.`
      )
    }

    return normalizedAmount.toFixed(2)
  }

  protected asPaymentData(data: Record<string, unknown> | undefined | null): PayPalPaymentData {
    return data ? { ...data } : {}
  }

  protected getOrderId(data: PayPalPaymentData) {
    return typeof data.order_id === "string" && data.order_id.trim()
      ? data.order_id
      : undefined
  }

  protected getAuthorizationId(data: PayPalPaymentData) {
    return typeof data.authorization_id === "string" && data.authorization_id.trim()
      ? data.authorization_id
      : undefined
  }

  protected getCaptureId(data: PayPalPaymentData) {
    return typeof data.capture_id === "string" && data.capture_id.trim()
      ? data.capture_id
      : undefined
  }

  protected getSessionId(data: PayPalPaymentData) {
    return typeof data.session_id === "string" && data.session_id.trim()
      ? data.session_id
      : undefined
  }

  protected getChargeCurrencyCode(data: PayPalPaymentData, fallback: string) {
    return (
      (typeof data.charge_currency_code === "string" && data.charge_currency_code.trim()
        ? data.charge_currency_code
        : undefined) ??
      fallback
    ).toUpperCase()
  }

  protected getDisplayCurrencyCode(data: PayPalPaymentData, fallback: string) {
    return (
      (typeof data.display_currency_code === "string" && data.display_currency_code.trim()
        ? data.display_currency_code
        : undefined) ??
      fallback
    ).toUpperCase()
  }

  protected getChargeAmount(data: PayPalPaymentData, fallback: BigNumberInput) {
    return asNumber(data.charge_amount) ?? Number(fallback)
  }

  protected buildPaymentIntent() {
    return this.options_.autoCapture
      ? CheckoutPaymentIntent.Capture
      : CheckoutPaymentIntent.Authorize
  }

  protected async verifyWebhookSignature(payload: ProviderWebhookPayload["payload"]) {
    if (!this.options_.webhook_id) {
      this.logger_.warn(
        "[PAYPAL] PAYPAL_WEBHOOK_ID is not configured. Webhook signature verification is skipped."
      )
      return true
    }

    const rawBody =
      typeof payload.rawData === "string"
        ? payload.rawData
        : payload.rawData instanceof Buffer
          ? payload.rawData.toString("utf8")
          : JSON.stringify(payload.data ?? {})

    const token = await this.client_.clientCredentialsAuthManager.fetchToken()
    const response = await fetch(`${this.getBaseApiUrl()}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: asString(payload.headers["paypal-auth-algo"]),
        cert_url: asString(payload.headers["paypal-cert-url"]),
        transmission_id: asString(payload.headers["paypal-transmission-id"]),
        transmission_sig: asString(payload.headers["paypal-transmission-sig"]),
        transmission_time: asString(payload.headers["paypal-transmission-time"]),
        webhook_id: this.options_.webhook_id,
        webhook_event: JSON.parse(rawBody),
      }),
    })

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `PayPal webhook signature verification failed with status ${response.status}.`
      )
    }

    const result = (await response.json()) as { verification_status?: string }
    return result.verification_status === "SUCCESS"
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    try {
      const sessionData = this.asPaymentData(input.data)
      const sessionId = this.getSessionId(sessionData)
      const displayCurrencyCode = this.getDisplayCurrencyCode(
        sessionData,
        input.currency_code.toUpperCase()
      )
      const chargeCurrencyCode = this.getChargeCurrencyCode(
        sessionData,
        input.currency_code.toUpperCase()
      )
      const chargeAmount = this.getChargeAmount(sessionData, input.amount)
      assertPayPalCurrencySupported(chargeCurrencyCode)

      const response = await this.ordersController_.createOrder({
        prefer: "return=representation",
        body: {
          intent: this.buildPaymentIntent(),
          purchaseUnits: [
            {
              referenceId: "default",
              customId: sessionId,
              invoiceId: sessionId,
              description: "Nova Forza pickup checkout",
              amount: {
                currencyCode: chargeCurrencyCode,
                value: this.formatAmount(chargeAmount),
              },
            },
          ],
        },
      })
      const order = response.result

      if (!order?.id) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to create PayPal order."
        )
      }

      return {
        id: order.id,
        data: {
          ...sessionData,
          order_id: order.id,
          session_id: sessionId,
          currency_code: displayCurrencyCode,
          display_currency_code: displayCurrencyCode,
          display_amount: asNumber(sessionData.display_amount) ?? Number(input.amount),
          charge_currency_code: chargeCurrencyCode,
          charge_amount: chargeAmount,
          exchange_rate: asNumber(sessionData.exchange_rate),
          exchange_rate_source: asString(sessionData.exchange_rate_source),
          exchange_rate_reference: asString(sessionData.exchange_rate_reference),
          intent: this.options_.autoCapture ? "CAPTURE" : "AUTHORIZE",
          status: order.status,
        },
        status: PaymentSessionStatus.PENDING,
      }
    } catch (error) {
      throw toPayPalMedusaError(error, "No se pudo iniciar la sesion de PayPal.")
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = this.asPaymentData(input.data)
    const orderId = this.getOrderId(data)

    if (!orderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal order ID is required."
      )
    }

    if (this.options_.autoCapture) {
      const response = await this.ordersController_.captureOrder({
        id: orderId,
        prefer: "return=representation",
      })
      const order = response.result
      const captureId = order?.purchaseUnits?.[0]?.payments?.captures?.[0]?.id

      if (!captureId) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Failed to capture PayPal payment."
        )
      }

      return {
        data: {
          ...data,
          capture_id: captureId,
          intent: "CAPTURE",
          order_id: orderId,
        },
        status: PaymentSessionStatus.CAPTURED,
      }
    }

    const response = await this.ordersController_.authorizeOrder({
      id: orderId,
      prefer: "return=representation",
    })
    const order = response.result
    const authorizationId = order?.purchaseUnits?.[0]?.payments?.authorizations?.[0]?.id

    if (!authorizationId) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to authorize PayPal payment."
      )
    }

    return {
      data: {
        ...data,
        authorization_id: authorizationId,
        intent: "AUTHORIZE",
        order_id: orderId,
      },
      status: PaymentSessionStatus.AUTHORIZED,
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = this.asPaymentData(input.data)
    const existingCaptureId = this.getCaptureId(data)

    if (existingCaptureId) {
      return { data }
    }

    const authorizationId = this.getAuthorizationId(data)

    if (!authorizationId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal authorization ID is required to capture a payment."
      )
    }

    const response = await this.paymentsController_.captureAuthorizedPayment({
      authorizationId,
      prefer: "return=representation",
    })
    const capture = response.result

    if (!capture?.id) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to capture authorized PayPal payment."
      )
    }

    return {
      data: {
        ...data,
        capture_id: capture.id,
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = this.asPaymentData(input.data)
    const authorizationId = this.getAuthorizationId(data)

    if (!authorizationId) {
      return { data }
    }

    await this.paymentsController_.voidPayment({
      authorizationId,
      prefer: "return=representation",
    })

    return { data }
  }

  async deletePayment(input: CancelPaymentInput) {
    return this.cancelPayment(input)
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const orderId = this.getOrderId(this.asPaymentData(input.data))

    if (!orderId) {
      return { status: PaymentSessionStatus.PENDING }
    }

    try {
      const response = await this.ordersController_.getOrder({ id: orderId })
      const order = response.result

      if (!order) {
        return { status: PaymentSessionStatus.PENDING }
      }

      switch (order.status) {
        case OrderStatus.Created:
        case OrderStatus.Saved:
          return { status: PaymentSessionStatus.PENDING }
        case OrderStatus.Approved:
          return { status: PaymentSessionStatus.AUTHORIZED }
        case OrderStatus.Completed:
          return {
            status: this.options_.autoCapture
              ? PaymentSessionStatus.CAPTURED
              : PaymentSessionStatus.AUTHORIZED,
          }
        case OrderStatus.Voided:
          return { status: PaymentSessionStatus.CANCELED }
        default:
          return { status: PaymentSessionStatus.PENDING }
      }
    } catch {
      return { status: PaymentSessionStatus.PENDING }
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = this.asPaymentData(input.data)
    const captureId = this.getCaptureId(data)

    if (!captureId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PayPal capture ID is required to refund a payment."
      )
    }

    await this.paymentsController_.refundCapturedPayment({
      captureId,
      prefer: "return=representation",
      body: input.amount
        ? {
            amount: {
              currencyCode:
                this.getChargeCurrencyCode(
                  data,
                  (typeof data.currency_code === "string" ? data.currency_code : "USD").toUpperCase()
                ),
              value: this.formatAmount(input.amount),
            },
          }
        : undefined,
    })

    return { data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = this.asPaymentData(input.data)
    const captureId = this.getCaptureId(data)

    if (captureId) {
      const response = await this.paymentsController_.getCapturedPayment({
        captureId,
      })

      return {
        data: {
          ...data,
          capture: response.result ?? null,
        },
      }
    }

    const authorizationId = this.getAuthorizationId(data)

    if (authorizationId) {
      const response = await this.paymentsController_.getAuthorizedPayment({
        authorizationId,
      })

      return {
        data: {
          ...data,
          authorization: response.result ?? null,
        },
      }
    }

    const orderId = this.getOrderId(data)

    if (!orderId) {
      return { data }
    }

    const response = await this.ordersController_.getOrder({ id: orderId })

    return {
      data: {
        ...data,
        order: response.result ?? null,
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const data = this.asPaymentData(input.data)
    const orderId = this.getOrderId(data)

    if (!orderId) {
      return this.initiatePayment(input)
    }

      await this.ordersController_.patchOrder({
      id: orderId,
      body: [
        {
          op: "replace",
          path: "/purchase_units/@reference_id=='default'/amount",
          value: {
            currencyCode: this.getChargeCurrencyCode(data, input.currency_code.toUpperCase()),
            value: this.formatAmount(this.getChargeAmount(data, input.amount)),
          },
        } as never,
      ],
    })

    return {
      data: {
        ...data,
        currency_code: this.getDisplayCurrencyCode(data, input.currency_code.toUpperCase()),
        display_currency_code: this.getDisplayCurrencyCode(data, input.currency_code.toUpperCase()),
        display_amount: asNumber(data.display_amount) ?? Number(input.amount),
        charge_currency_code: this.getChargeCurrencyCode(data, input.currency_code.toUpperCase()),
        charge_amount: this.getChargeAmount(data, input.amount),
      },
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    try {
      const isVerified = await this.verifyWebhookSignature(payload)

      if (!isVerified) {
        return { action: PaymentActions.FAILED }
      }

      const event = payload.data as Record<string, unknown>
      const eventType =
        typeof event.event_type === "string" ? event.event_type : null
      const resource = asRecord(event.resource)
      const sessionId =
        asString(resource?.custom_id) ||
        asString(resource?.customId) ||
        asString(resource?.invoice_id) ||
        asString(resource?.invoiceId) ||
        ""
      const captureAmountValue = getPayPalCaptureAmountValue(resource)
      const amountValue = asString(asRecord(resource?.amount)?.value) ?? captureAmountValue ?? "0"
      const amount = new BigNumber(Number(amountValue || 0))

      switch (eventType) {
        case "PAYMENT.AUTHORIZATION.CREATED":
          return {
            action: PaymentActions.AUTHORIZED,
            data: {
              session_id: sessionId,
              amount,
            },
          }
        case "PAYMENT.AUTHORIZATION.VOIDED":
          return {
            action: PaymentActions.CANCELED,
            data: {
              session_id: sessionId,
              amount,
            },
          }
        case "PAYMENT.CAPTURE.COMPLETED":
          return {
            action: PaymentActions.SUCCESSFUL,
            data: {
              session_id: sessionId,
              amount,
            },
          }
        case "PAYMENT.CAPTURE.DENIED":
          return {
            action: PaymentActions.FAILED,
            data: {
              session_id: sessionId,
              amount,
            },
          }
        default:
          return {
            action: PaymentActions.NOT_SUPPORTED,
            data: {
              session_id: sessionId,
              amount,
            },
          }
      }
    } catch (error) {
      this.logger_.error(
        `[PAYPAL] getWebhookActionAndData failed: ${error instanceof Error ? error.message : error}`
      )

      return {
        action: PaymentActions.FAILED,
        data: {
          session_id: "",
          amount: new BigNumber(0),
        },
      }
    }
  }
}

export default PayPalPaymentProviderService
