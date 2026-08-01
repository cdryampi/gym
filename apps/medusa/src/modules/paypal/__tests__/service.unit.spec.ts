import PayPalPaymentProviderService from "../service"
import { MedusaError } from "@medusajs/framework/utils"

// Mock dependencies
const mockOrdersController = {
  createOrder: jest.fn(),
  patchOrder: jest.fn(),
  getOrder: jest.fn(),
  captureOrder: jest.fn(),
  authorizeOrder: jest.fn(),
}
const mockPaymentsController = {
  captureAuthorizedPayment: jest.fn(),
  getCapturedPayment: jest.fn(),
  getAuthorizedPayment: jest.fn(),
  refundCapturedPayment: jest.fn(),
  voidPayment: jest.fn(),
}

jest.mock("@paypal/paypal-server-sdk", () => ({
  ...jest.requireActual("@paypal/paypal-server-sdk"),
  Client: jest.fn().mockImplementation(() => ({
    clientCredentialsAuthManager: {
      fetchToken: jest.fn().mockResolvedValue({ accessToken: "test-token" })
    }
  })),
  OrdersController: jest.fn().mockImplementation(() => mockOrdersController),
  PaymentsController: jest.fn().mockImplementation(() => mockPaymentsController),
  Environment: { Sandbox: "sandbox", Production: "production" },
  CheckoutPaymentIntent: { Capture: "CAPTURE", Authorize: "AUTHORIZE" },
  OrderStatus: { Created: "CREATED", Approved: "APPROVED", Completed: "COMPLETED" }
}))

describe("PayPalPaymentProviderService", () => {
  let service: PayPalPaymentProviderService
  let logger: any

  beforeEach(() => {
    jest.clearAllMocks()
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }
    service = new PayPalPaymentProviderService(
      { logger } as any,
      { client_id: "test", client_secret: "test", environment: "sandbox" }
    )
  })

  describe("initiatePayment", () => {
    it("should fail if display_amount doesn't match input.amount", async () => {
      const input: any = {
        amount: 1000, // 10.00
        currency_code: "usd",
        data: {
          display_amount: 1500 // 15.00 - Manipulated!
        }
      }

      await expect(service.initiatePayment(input)).rejects.toThrow(
        "El monto del pago no coincide con el total del carrito."
      )
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Amount mismatch"))
    })

    it("should pass if display_amount matches input.amount", async () => {
      const input: any = {
        amount: 1000,
        currency_code: "usd",
        data: {
          display_amount: 1000
        }
      }

      mockOrdersController.createOrder.mockResolvedValue({
        result: { id: "pay_123", status: "CREATED" }
      })

      const result = await service.initiatePayment(input)
      expect(result.id).toBe("pay_123")
    })
  })

  describe("updatePayment", () => {
    it("should fail if display_amount doesn't match input.amount during update", async () => {
      const input: any = {
        amount: 2000,
        currency_code: "usd",
        data: {
          order_id: "pay_123",
          display_amount: 1000 // Old amount, not updated to 2000 - Manipulated!
        }
      }

      await expect(service.updatePayment(input)).rejects.toThrow(
        "El monto del pago actualizado no coincide con el total del carrito."
      )
    })

    it("should pass if amounts match during update", async () => {
      const input: any = {
        amount: 2000,
        currency_code: "usd",
        data: {
          order_id: "pay_123",
          display_amount: 2000
        }
      }

      mockOrdersController.patchOrder.mockResolvedValue({ result: {} })

      const result = await service.updatePayment(input)
      expect(result.data?.charge_amount).toBe(2000)
    })
  })
})
