import { defineMiddlewares } from "@medusajs/framework/http";

import { attachGymCartMiddlewares } from "./admin/gym/carts/attach/middlewares";
import { resolveGymCustomerMiddlewares } from "./admin/gym/customers/resolve/middlewares";
import { pickupRequestMiddlewares } from "./admin/gym/pickup-requests/middlewares";
import { pickupRequestStatusMiddlewares } from "./admin/gym/pickup-requests/[id]/status/middlewares";
import { pickupRequestEmailMiddlewares } from "./admin/gym/pickup-requests/[id]/resend-email/middlewares";
import { pickupRequestSyncOrderMiddlewares } from "./admin/gym/pickup-requests/sync-order/middlewares";

export default defineMiddlewares({
  routes: [
    ...resolveGymCustomerMiddlewares,
    ...attachGymCartMiddlewares,
    ...pickupRequestMiddlewares,
    ...pickupRequestSyncOrderMiddlewares,
    ...pickupRequestStatusMiddlewares,
    ...pickupRequestEmailMiddlewares,
  ],
});
