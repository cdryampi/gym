import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import ensurePayPalReadyLoader from "./loaders/ensure-paypal-ready"
import PayPalPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [PayPalPaymentProviderService],
  loaders: [ensurePayPalReadyLoader],
})
