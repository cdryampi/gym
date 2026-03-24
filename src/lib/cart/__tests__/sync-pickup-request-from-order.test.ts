import { describe, expect, it, vi } from "vitest";

import { __syncPickupRequestFromOrderTestables } from "../../../../apps/medusa/src/workflows/steps/sync-pickup-request-from-order";

describe("sync pickup_request from order helpers", () => {
  it("hydrates an order snapshot from order_summary/order_item/order_line_item rows", async () => {
    const pgConnection = {
      raw: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "order_01",
            display_id: 11,
            email: "socio@gym.com",
            customer_id: "cus_01",
            currency_code: "pen",
            created_at: "2026-03-24T10:00:00.000Z",
            updated_at: "2026-03-24T10:01:00.000Z",
            totals: JSON.stringify({
              current_order_total: 6490,
            }),
            quantity: 1,
            line_id: "line_01",
            title: "Straps de Levantamiento Pro",
            thumbnail: null,
            product_id: "prod_01",
            product_title: "Straps de Levantamiento Pro",
            product_handle: "straps-de-levantamiento-pro",
            variant_id: "variant_01",
            variant_title: "Default",
            variant_sku: "SB-STRAPS-DE-LEVANTAMIENTO-PRO",
            unit_price: 6490,
            variant_option_values: JSON.stringify({
              Color: "Negro",
            }),
          },
        ],
      }),
    };

    const order = await __syncPickupRequestFromOrderTestables.retrieveOrderSnapshot(
      pgConnection,
      "order_01",
    );

    expect(order).toEqual({
      id: "order_01",
      display_id: 11,
      email: "socio@gym.com",
      customer_id: "cus_01",
      currency_code: "pen",
      subtotal: 6490,
      total: 6490,
      created_at: "2026-03-24T10:00:00.000Z",
      updated_at: "2026-03-24T10:01:00.000Z",
      items: [
        expect.objectContaining({
          id: "line_01",
          quantity: 1,
          unit_price: 6490,
          total: 6490,
          product_handle: "straps-de-levantamiento-pro",
        }),
      ],
    });
  });

  it("maps line items and selected options from the order snapshot plus cart metadata", () => {
    const lineItems = __syncPickupRequestFromOrderTestables.mapLineItems(
      [
        {
          id: "line_01",
          title: "Straps de Levantamiento Pro",
          quantity: 2,
          thumbnail: null,
          product_id: "prod_01",
          product_title: "Straps de Levantamiento Pro",
          product_handle: "straps-de-levantamiento-pro",
          variant_id: "variant_01",
          variant_title: "Default",
          variant_sku: "SB-STRAPS-DE-LEVANTAMIENTO-PRO",
          unit_price: 6490,
          total: 12980,
        },
      ],
      [
        {
          variant_id: "variant_01",
          product_handle: "straps-de-levantamiento-pro",
          variant_title: "Default",
          variant_sku: "SB-STRAPS-DE-LEVANTAMIENTO-PRO",
          variant_option_values: {
            Color: "Negro",
            Talla: "M",
          },
        },
      ],
    );

    expect(lineItems).toEqual([
      {
        id: "line_01",
        title: "Straps de Levantamiento Pro",
        quantity: 2,
        thumbnail: null,
        product_id: "prod_01",
        product_title: "Straps de Levantamiento Pro",
        product_handle: "straps-de-levantamiento-pro",
        variant_id: "variant_01",
        variant_title: "Default",
        variant_sku: "SB-STRAPS-DE-LEVANTAMIENTO-PRO",
        unit_price: 64.9,
        total: 129.8,
        selected_options: [
          {
            option_title: "Color",
            value: "Negro",
          },
          {
            option_title: "Talla",
            value: "M",
          },
        ],
      },
    ]);
  });

  it("resolves PayPal payment snapshot from cart_payment_collection/payment_session rows", async () => {
    const pgConnection = {
      raw: vi.fn().mockResolvedValue({
        rows: [
          {
            payment_collection_id: "pay_col_01",
            authorized_amount: 1708,
            captured_amount: 1708,
            payment_collection_status: "authorized",
            payment_id: "payment_01",
            payment_provider_id: "paypal",
            payment_data: JSON.stringify({
              order_id: "paypal_order_01",
              capture_id: "capture_01",
              charge_currency_code: "USD",
              charge_amount: 1708,
            }),
            payment_created_at: "2026-03-24T10:00:00.000Z",
            payment_captured_at: "2026-03-24T10:01:00.000Z",
            payment_session_id: "pay_sess_01",
            payment_session_provider_id: "paypal",
            payment_session_status: "authorized",
            payment_session_authorized_at: "2026-03-24T10:00:00.000Z",
            payment_session_data: JSON.stringify({
              order_id: "paypal_order_01",
              charge_currency_code: "USD",
              charge_amount: 1708,
            }),
          },
        ],
      }),
    };

    const paymentSnapshot =
      await __syncPickupRequestFromOrderTestables.resolvePaymentSnapshotByCart(
        pgConnection,
        "cart_01",
      );

    expect(paymentSnapshot).toEqual({
      payment_collection_id: "pay_col_01",
      payment_provider: "paypal",
      payment_status: "captured",
      paypal_order_id: "paypal_order_01",
      paypal_capture_id: "capture_01",
      payment_authorized_at: "2026-03-24T10:00:00.000Z",
      payment_captured_at: "2026-03-24T10:01:00.000Z",
      charged_currency_code: "USD",
      charged_total: 17.08,
      exchange_rate: null,
      exchange_rate_source: null,
      exchange_rate_reference: null,
    });
  });
});
