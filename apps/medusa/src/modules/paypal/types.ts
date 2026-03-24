export type PayPalModuleOptions = {
  client_id: string
  client_secret: string
  environment?: "sandbox" | "production"
  autoCapture?: boolean
  webhook_id?: string
  region_id?: string
  region_name?: string
}

export const PAYPAL_PROVIDER_CONFIG_ID = "paypal"
export const PAYPAL_PROVIDER_ID = "pp_paypal_paypal"
