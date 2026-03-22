export const pickupRequestStatuses = [
  "requested",
  "confirmed",
  "ready_for_pickup",
  "fulfilled",
  "cancelled",
] as const

export const pickupRequestEmailStatuses = ["pending", "sent", "failed"] as const

export type PickupRequestStatus = (typeof pickupRequestStatuses)[number]
export type PickupRequestEmailStatus = (typeof pickupRequestEmailStatuses)[number]
