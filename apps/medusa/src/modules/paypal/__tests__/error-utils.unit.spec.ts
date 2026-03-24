import { MedusaError } from "@medusajs/framework/utils"

import {
  assertPayPalCurrencySupported,
  toPayPalMedusaError,
} from "../error-utils"

describe("paypal error utils", () => {
  it("rejects unsupported currencies before calling PayPal", () => {
    expect(() => assertPayPalCurrencySupported("PEN")).toThrow(
      /PayPal no admite pagos en PEN/i
    )
  })

  it("accepts supported currencies", () => {
    expect(() => assertPayPalCurrencySupported("EUR")).not.toThrow()
  })

  it("translates PayPal currency mismatch errors into Medusa errors", () => {
    const error = toPayPalMedusaError(
      {
        body: JSON.stringify({
          details: [
            {
              issue: "CURRENCY_NOT_SUPPORTED",
              description: "Currency code is not currently supported.",
            },
          ],
        }),
      },
      "No se pudo iniciar PayPal."
    )

    expect(error).toBeInstanceOf(MedusaError)
    expect(error.message).toContain("Currency code is not currently supported")
  })
})
