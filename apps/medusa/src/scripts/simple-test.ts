import { ExecArgs } from "@medusajs/framework/types";

export default async function test({ container }: ExecArgs) {
  console.log("Medusa Container Bootstrapped!");
  const store = await container.resolve("storeModuleService");
  const stores = await store.listStores();
  console.log("Stores:", stores.length);
}
