import { describe, expect, it } from "vitest";
import { mapMedusaCart, type MedusaCart } from "../medusa";

type PartialCartInput = Partial<MedusaCart> & {
  items?: Array<Partial<NonNullable<MedusaCart["items"]>[number]>> | null;
};

describe("medusa cart mapping robustness", () => {
    const baseCart: MedusaCart = {
        id: "cart_01",
        currency_code: "pen",
        subtotal: 1000,
        total: 1000,
        items: [
            {
                id: "item_01",
                title: "Test Item",
                quantity: 1,
                unit_price: 1000,
                subtotal: 1000,
                total: 1000,
            }
        ]
    };

    it("handles null or undefined prices gracefully by defaulting to 0", () => {
        const corruptCart: PartialCartInput = {
            ...baseCart,
            subtotal: null,
            total: undefined,
            items: [
                {
                    ...baseCart.items![0],
                    unit_price: null,
                }
            ],
        };

        const result = mapMedusaCart(corruptCart as MedusaCart);
        expect(result.summary.subtotal).toBe(0);
        expect(result.summary.total).toBe(0);
        expect(result.items[0].unitPrice).toBe(0);
    });

    it("normalizes currency codes to uppercase", () => {
        const result = mapMedusaCart({ ...baseCart, currency_code: "usd" });
        expect(result.summary.currencyCode).toBe("USD");
    });

    it("handles missing currency code by using default", () => {
        const result = mapMedusaCart({ ...baseCart, currency_code: null } as MedusaCart);
        expect(result.summary.currencyCode).toBe("PEN"); // Default from currency.ts
    });

    it("correctly calculates itemCount from multiple items with different quantities", () => {
        const manyItemsCart: MedusaCart = {
            ...baseCart,
            items: [
                { id: "1", quantity: 2, unit_price: 100, total: 200, title: "A" },
                { id: "2", quantity: 5, unit_price: 200, total: 1000, title: "B" },
            ]
        };
        const result = mapMedusaCart(manyItemsCart);
        expect(result.summary.itemCount).toBe(7);
    });

    it("handles large integers without precision loss (simulated cents)", () => {
        // 1,000,000.99 PEN = 100000099 cents
        const highValueCart: MedusaCart = {
            ...baseCart,
            total: 100000099,
        };
        const result = mapMedusaCart(highValueCart);
        expect(result.summary.total).toBe(1000000.99);
    });

    it("preserves metadata correctly", () => {
        const metaCart: MedusaCart = {
            ...baseCart,
            metadata: { custom_key: "custom_value", pickup_request_status: "submitted" }
        };
        const result = mapMedusaCart(metaCart);
        expect(result.metadata).toEqual({ custom_key: "custom_value", pickup_request_status: "submitted" });
        expect(result.summary.pickupRequestStatus).toBe("submitted");
    });

    it("handles empty items list", () => {
        const result = mapMedusaCart({ ...baseCart, items: [] });
        expect(result.items).toEqual([]);
        expect(result.summary.itemCount).toBe(0);
    });
    
    it("handles null items list", () => {
        const result = mapMedusaCart({ ...baseCart, items: null });
        expect(result.items).toEqual([]);
        expect(result.summary.itemCount).toBe(0);
    });
});
