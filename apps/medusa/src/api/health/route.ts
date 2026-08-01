import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    await query.graph({
      entity: "product",
      fields: ["id"],
      pagination: { take: 1 },
    })

    return res.status(200).json({
      status: "healthy",
      service: "gym-medusa",
      timestamp: new Date().toISOString(),
    })
  } catch {
    return res.status(503).json({
      status: "unhealthy",
      service: "gym-medusa",
      timestamp: new Date().toISOString(),
    })
  }
}
