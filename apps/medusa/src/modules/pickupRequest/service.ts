import { MedusaService } from "@medusajs/framework/utils"

import PickupRequest from "./models/pickup-request"

class PickupRequestModuleService extends MedusaService({
  PickupRequest,
}) {}

export default PickupRequestModuleService
