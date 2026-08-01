import { GET } from "../route"

describe("GET /health", () => {
  function buildResponse() {
    const json = jest.fn().mockReturnThis()
    const status = jest.fn().mockReturnValue({ json })
    return { json, status }
  }

  it("returns a stable public health response without sensitive details", async () => {
    const { json, status } = buildResponse()
    const graph = jest.fn().mockResolvedValue({ data: [] })

    await GET(
      { scope: { resolve: jest.fn().mockReturnValue({ graph }) } } as never,
      { status } as never,
    )

    expect(status).toHaveBeenCalledWith(200)
    expect(graph).toHaveBeenCalledWith({
      entity: "product",
      fields: ["id"],
      pagination: { take: 1 },
    })
    expect(json).toHaveBeenCalledWith({
      status: "healthy",
      service: "gym-medusa",
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    })
    expect(JSON.stringify(json.mock.calls[0][0])).not.toMatch(/secret|database|redis/i)
  })

  it("returns 503 without leaking the dependency error", async () => {
    const { json, status } = buildResponse()
    const graph = jest.fn().mockRejectedValue(new Error("postgres password=secret"))

    await GET(
      { scope: { resolve: jest.fn().mockReturnValue({ graph }) } } as never,
      { status } as never,
    )

    expect(status).toHaveBeenCalledWith(503)
    expect(json).toHaveBeenCalledWith({
      status: "unhealthy",
      service: "gym-medusa",
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    })
    expect(JSON.stringify(json.mock.calls[0][0])).not.toMatch(/secret|password|database|redis/i)
  })
})
