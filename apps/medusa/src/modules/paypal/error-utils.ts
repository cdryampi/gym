import { MedusaError } from "@medusajs/framework/utils"

const PAYPAL_SUPPORTED_CURRENCY_CODES = new Set([
  "AUD",
  "BRL",
  "CAD",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "ILS",
  "JPY",
  "MYR",
  "MXN",
  "NOK",
  "NZD",
  "PHP",
  "PLN",
  "RUB",
  "SGD",
  "SEK",
  "CHF",
  "TWD",
  "THB",
  "USD",
])

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function parseBody(body: unknown) {
  if (typeof body !== "string" || !body.trim()) {
    return null
  }

  try {
    return asRecord(JSON.parse(body))
  } catch {
    return null
  }
}

export function assertPayPalCurrencySupported(currencyCode: string) {
  const normalized = currencyCode.toUpperCase()

  if (PAYPAL_SUPPORTED_CURRENCY_CODES.has(normalized)) {
    return
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `PayPal no admite pagos en ${normalized} para este checkout. Configura una moneda soportada por PayPal, como EUR o USD.`
  )
}

export function toPayPalMedusaError(error: unknown, fallbackMessage: string) {
  if (error instanceof MedusaError) {
    return error
  }

  const record = asRecord(error)
  const result = asRecord(record?.result)
  const body = parseBody(record?.body)
  const details = Array.isArray(result?.details)
    ? result.details
    : Array.isArray(body?.details)
      ? body?.details
      : []
  const firstDetail = asRecord(details[0])
  const issue = asString(firstDetail?.issue)
  const detailDescription = asString(firstDetail?.description)
  const message =
    asString(result?.message) ??
    asString(body?.message) ??
    asString(record?.message)

  if (issue === "CURRENCY_NOT_SUPPORTED") {
    return new MedusaError(
      MedusaError.Types.INVALID_DATA,
      detailDescription ??
        "PayPal no admite la moneda actual del checkout. Usa una moneda soportada como EUR o USD."
    )
  }

  if (message && message !== "An unknown error occurred.") {
    return new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `${fallbackMessage} ${message}`
    )
  }

  return new MedusaError(MedusaError.Types.UNEXPECTED_STATE, fallbackMessage)
}

export const __paypalErrorTestables = {
  PAYPAL_SUPPORTED_CURRENCY_CODES,
}
