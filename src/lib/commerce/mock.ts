import { products as mockProducts } from "@/data/products";
import type { Product } from "@/data/types";

export function getMockCommerceProducts(): Product[] {
  return [...mockProducts]
    .filter((product) => product.active)
    .sort((left, right) => left.order - right.order);
}
