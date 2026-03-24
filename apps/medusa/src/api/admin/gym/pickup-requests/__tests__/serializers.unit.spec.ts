import { serializePickupRequest } from "../serializers"

describe("pickup request serializer", () => {
  it("maps a valid pickup request payload with normalized dates and line items", () => {
    const serialized = serializePickupRequest({
      id: "pick_01",
      request_number: "NF-20260322-ABC123",
      cart_id: "cart_01",
      customer_id: "cus_01",
      supabase_user_id: "user_01",
      email: "socio@gym.com",
      notes: "Recoger en recepcion",
      status: "confirmed",
      currency_code: "PEN",
      item_count: "2",
      subtotal: "89.9",
      total: "89.9",
      charged_currency_code: "USD",
      charged_total: "26.48",
      exchange_rate: "3.395",
      exchange_rate_source: "BCRP PD04640PD",
      exchange_rate_reference: "19.Mar.26",
      line_items_snapshot: [
        {
          id: "line_01",
          title: "Creatina",
          quantity: "2",
          unit_price: "44.95",
          total: "89.9",
          selected_options: [
            { option_title: "Formato", value: "300g" },
            { option_title: "", value: "ignorar" },
          ],
        },
        {
          title: "Sin id",
        },
      ],
      source: "gym-storefront",
      email_status: "sent",
      email_sent_at: new Date("2026-03-22T12:00:00.000Z"),
      email_error: null,
      created_at: new Date("2026-03-22T10:00:00.000Z"),
      updated_at: "2026-03-22T11:00:00.000Z",
    })

    expect(serialized).toEqual(
      expect.objectContaining({
        id: "pick_01",
        request_number: "NF-20260322-ABC123",
        status: "confirmed",
        email_status: "sent",
        charged_currency_code: "USD",
        charged_total: 26.48,
        exchange_rate: 3.395,
        exchange_rate_reference: "19.Mar.26",
        email_sent_at: "2026-03-22T12:00:00.000Z",
        created_at: "2026-03-22T10:00:00.000Z",
        updated_at: "2026-03-22T11:00:00.000Z",
      })
    )
    expect(serialized.line_items_snapshot).toEqual([
      expect.objectContaining({
        id: "line_01",
        title: "Creatina",
        quantity: 2,
        unit_price: 44.95,
        total: 89.9,
        selected_options: [{ option_title: "Formato", value: "300g" }],
      }),
    ])
  })

  it("applies safe defaults for sparse payloads", () => {
    const serialized = serializePickupRequest({
      id: "pick_02",
      request_number: "NF-2",
      cart_id: null,
      status: "unknown",
      line_items_snapshot: [{ id: "line_02" }],
    })

    expect(serialized).toEqual(
      expect.objectContaining({
        cart_id: "",
        email: "",
        status: "unknown",
        currency_code: "PEN",
        item_count: 0,
        subtotal: 0,
        total: 0,
        charged_currency_code: null,
        charged_total: null,
        exchange_rate: null,
        source: "gym-storefront",
        email_status: "pending",
      })
    )
    expect(serialized.line_items_snapshot).toEqual([
      expect.objectContaining({
        id: "line_02",
        title: "Producto",
        quantity: 0,
      }),
    ])
  })

  it("throws when the payload misses the required identifiers", () => {
    expect(() => serializePickupRequest({ id: "pick_missing_number" })).toThrow(
      "Pickup request payload is invalid."
    )
    expect(() => serializePickupRequest({ request_number: "NF-3" })).toThrow(
      "Pickup request payload is invalid."
    )
  })
})
