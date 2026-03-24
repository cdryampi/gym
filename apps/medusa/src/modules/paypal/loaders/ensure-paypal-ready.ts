import type { ProviderLoaderOptions } from "@medusajs/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import type { PayPalModuleOptions } from "../types"

type QueryGraph = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: Array<Record<string, unknown>> }>
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function tryResolveQuery(container: ProviderLoaderOptions["container"], logger?: ProviderLoaderOptions["logger"]) {
  try {
    return container.resolve(ContainerRegistrationKeys.QUERY) as QueryGraph
  } catch {
    logger?.warn?.(
      "[PAYPAL] Query service is not ready during startup bootstrap. Skipping PayPal auto-setup for this boot."
    )
    return null
  }
}

async function bootstrapPayPal(
  container: ProviderLoaderOptions["container"],
  options: PayPalModuleOptions | undefined,
  logger?: ProviderLoaderOptions["logger"]
) {
  if (!options?.client_id || !options?.client_secret) {
    logger?.warn?.("[PAYPAL] Missing credentials, skipping PayPal checkout bootstrap.")
    return
  }

  const query = tryResolveQuery(container, logger)

  if (!query) {
    return
  }

  const filters: Record<string, unknown> = {}
  if (options.region_id) {
    filters.id = options.region_id
  } else if (options.region_name) {
    filters.name = options.region_name
  }

  try {
    const { data } = await query.graph({
      entity: "region",
      fields: ["id", "name", "*payment_providers"],
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    })

    const region = data[0]

    if (!region?.id) {
      logger?.warn?.("[PAYPAL] No region found to attach PayPal provider.")
      return
    }

    const providerIds = Array.isArray(region.payment_providers)
      ? region.payment_providers
          .map((provider) => asString(asRecord(provider)?.id))
          .filter((value): value is string => Boolean(value))
      : []

    if (!providerIds.includes("pp_paypal_paypal")) {
      logger?.info?.(
        `[PAYPAL] Region ${asString(region.id) ?? "unknown"} is missing pp_paypal_paypal. Update it from seed/bootstrap when needed.`
      )
    }
  } catch (error) {
    logger?.warn?.(
      `[PAYPAL] PayPal startup bootstrap skipped: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export default async function ensurePayPalReadyLoader({
  container,
  options,
  logger,
}: ProviderLoaderOptions<PayPalModuleOptions>) {
  logger?.info?.("[PAYPAL] Scheduling PayPal startup bootstrap...")

  setTimeout(() => {
    void bootstrapPayPal(container, options, logger)
  }, 1500)
}
