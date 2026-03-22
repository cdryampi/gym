export interface SelectedVariant {
  optionId?: string;
  optionTitle?: string;
  value: string;
}

export interface CartLineItem {
  id: string;
  title: string;
  thumbnail: string | null;
  quantity: number;
  productId: string | null;
  productTitle: string | null;
  productHandle: string | null;
  variantId: string | null;
  variantTitle: string | null;
  variantSku: string | null;
  unitPrice: number;
  subtotal: number;
  total: number;
  currencyCode: string;
  requiresShipping: boolean;
  selectedOptions: SelectedVariant[];
}

export interface CartSummary {
  currencyCode: string;
  itemCount: number;
  subtotal: number;
  total: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  requiresShipping: boolean;
  pickupRequestStatus: "draft" | "submitted";
  pickupRequestedAt: string | null;
  pickupRequestId: string | null;
  pickupRequestNumber: string | null;
}

export interface Cart {
  id: string;
  email: string | null;
  customerId: string | null;
  regionId: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown> | null;
  items: CartLineItem[];
  summary: CartSummary;
}

export interface CartVariantSelection {
  variantId: string;
  quantity: number;
}

export type PickupRequestStatus =
  | "requested"
  | "confirmed"
  | "ready_for_pickup"
  | "fulfilled"
  | "cancelled";

export type PickupRequestEmailStatus = "pending" | "sent" | "failed";

export interface PickupRequestLineItem {
  id: string;
  title: string;
  quantity: number;
  thumbnail: string | null;
  productId: string | null;
  productTitle: string | null;
  productHandle: string | null;
  variantId: string | null;
  variantTitle: string | null;
  variantSku: string | null;
  unitPrice: number;
  total: number;
  selectedOptions: SelectedVariant[];
}

export interface PickupRequestSummary {
  id: string;
  requestNumber: string;
  cartId: string;
  customerId: string | null;
  supabaseUserId: string | null;
  email: string;
  notes: string | null;
  status: PickupRequestStatus;
  currencyCode: string;
  itemCount: number;
  subtotal: number;
  total: number;
  source: string;
  emailStatus: PickupRequestEmailStatus;
  emailSentAt: string | null;
  emailError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PickupRequestDetail extends PickupRequestSummary {
  lineItems: PickupRequestLineItem[];
}
