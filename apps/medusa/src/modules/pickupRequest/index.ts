import { Module } from "@medusajs/framework/utils"

import PickupRequestModuleService from "./service"

export const PICKUP_REQUEST_MODULE = "pickupRequest"

export default Module(PICKUP_REQUEST_MODULE, {
  service: PickupRequestModuleService,
})
