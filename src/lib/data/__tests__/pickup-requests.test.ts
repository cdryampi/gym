import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

const dataPickupMocks = vi.hoisted(() => ({
  hasMedusaAdminEnv: vi.fn(),
  listPickupRequests: vi.fn(),
  retrievePickupRequest: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasMedusaAdminEnv: dataPickupMocks.hasMedusaAdminEnv,
}));

vi.mock("@/lib/cart/member-bridge", () => ({
  listPickupRequests: dataPickupMocks.listPickupRequests,
  retrievePickupRequest: dataPickupMocks.retrievePickupRequest,
}));

async function importPickupRequestsModule() {
  vi.resetModules();
  return import("@/lib/data/pickup-requests");
}

describe("pickup requests dashboard data", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns a readiness warning when Medusa admin env is missing", async () => {
    dataPickupMocks.hasMedusaAdminEnv.mockReturnValue(false);
    const { getPickupRequestsSnapshot } = await importPickupRequestsModule();

    const snapshot = await getPickupRequestsSnapshot();

    expect(snapshot).toEqual({
      pickupRequests: [],
      count: 0,
      warning:
        "El dashboard de pedidos pickup requiere MEDUSA_ADMIN_API_KEY y MEDUSA_BACKEND_URL " +
        "(o NEXT_PUBLIC_MEDUSA_BACKEND_URL). Configuralos para operar solicitudes reales.",
    });
    expect(dataPickupMocks.listPickupRequests).not.toHaveBeenCalled();
  });

  it("maps Medusa pickup requests into dashboard detail records", async () => {
    dataPickupMocks.hasMedusaAdminEnv.mockReturnValue(true);
    dataPickupMocks.listPickupRequests.mockResolvedValue({
      pickup_requests: [
        {
          id: "pick_01",
          request_number: "NF-20260322-ABC123",
          cart_id: "cart_01",
          email: "socio@gym.com",
          status: "confirmed",
          currency_code: "pen",
          item_count: 2,
          subtotal: 89.9,
          total: 89.9,
          email_status: "sent",
          source: "gym-storefront",
          created_at: "2026-03-22T09:00:00.000Z",
          updated_at: "2026-03-22T10:00:00.000Z",
          line_items_snapshot: [
            {
              id: "line_01",
              title: "Creatina",
              quantity: 2,
              total: 89.9,
              selected_options: [{ option_title: "Formato", value: "300g" }],
            },
          ],
        },
      ],
      count: 1,
    });

    const { getPickupRequestsSnapshot } = await importPickupRequestsModule();
    const snapshot = await getPickupRequestsSnapshot({
      status: "confirmed",
      email: "socio@gym.com",
      limit: 10,
      offset: 5,
    });

    expect(dataPickupMocks.listPickupRequests).toHaveBeenCalledWith({
      status: "confirmed",
      email: "socio@gym.com",
      limit: 10,
      offset: 5,
    });
    expect(snapshot.warning).toBeNull();
    expect(snapshot.count).toBe(1);
    expect(snapshot.pickupRequests[0]).toEqual(
      expect.objectContaining({
        id: "pick_01",
        requestNumber: "NF-20260322-ABC123",
        status: "confirmed",
        currencyCode: "PEN",
        emailStatus: "sent",
      }),
    );
    expect(snapshot.pickupRequests[0]?.lineItems[0]?.selectedOptions).toEqual([
      { optionTitle: "Formato", value: "300g" },
    ]);
  });

  it("surfaces the real error message when Medusa listing fails", async () => {
    dataPickupMocks.hasMedusaAdminEnv.mockReturnValue(true);
    dataPickupMocks.listPickupRequests.mockRejectedValue(new Error("Medusa timeout"));
    const { getPickupRequestsSnapshot } = await importPickupRequestsModule();

    const snapshot = await getPickupRequestsSnapshot();

    expect(snapshot.warning).toBe("Medusa timeout");
    expect(snapshot.pickupRequests).toEqual([]);
  });

  it("returns null for detail lookup when retrieval fails", async () => {
    dataPickupMocks.hasMedusaAdminEnv.mockReturnValue(true);
    dataPickupMocks.retrievePickupRequest.mockRejectedValue(new Error("boom"));
    const { getPickupRequestById } = await importPickupRequestsModule();

    const pickupRequest = await getPickupRequestById("pick_missing");

    expect(pickupRequest).toBeNull();
  });

  it("returns the latest pickup request by email from the snapshot", async () => {
    dataPickupMocks.hasMedusaAdminEnv.mockReturnValue(true);
    dataPickupMocks.listPickupRequests.mockResolvedValue({
      pickup_requests: [
        {
          id: "pick_last",
          request_number: "NF-20260322-LAST",
          cart_id: "cart_77",
          email: "guest@gym.com",
          status: "requested",
          currency_code: "PEN",
          item_count: 1,
          subtotal: 25,
          total: 25,
          email_status: "pending",
          source: "gym-storefront",
          created_at: "2026-03-22T11:00:00.000Z",
          updated_at: "2026-03-22T11:00:00.000Z",
          line_items_snapshot: [],
        },
      ],
      count: 1,
    });

    const { getLatestPickupRequestByEmail } = await importPickupRequestsModule();
    const pickupRequest = await getLatestPickupRequestByEmail("guest@gym.com");

    expect(dataPickupMocks.listPickupRequests).toHaveBeenCalledWith({
      email: "guest@gym.com",
      status: null,
      limit: 1,
      offset: 0,
    });
    expect(pickupRequest?.id).toBe("pick_last");
  });
});
