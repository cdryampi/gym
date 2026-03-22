import { getDefaultCommerceLocale } from "@/lib/commerce/currency";

export function formatCartAmount(amount: number, currencyCode: string) {
  return new Intl.NumberFormat(getDefaultCommerceLocale(), {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}
