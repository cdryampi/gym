import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260322220000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "pickup_request" add column if not exists "order_id" text null, add column if not exists "payment_collection_id" text null, add column if not exists "payment_provider" text null, add column if not exists "payment_status" text not null default 'pending', add column if not exists "paypal_order_id" text null, add column if not exists "paypal_capture_id" text null, add column if not exists "payment_authorized_at" timestamptz null, add column if not exists "payment_captured_at" timestamptz null;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pickup_request_order_id_unique" ON "pickup_request" ("order_id") WHERE deleted_at IS NULL AND order_id IS NOT NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_pickup_request_order_id_unique";`)
    this.addSql(
      `alter table if exists "pickup_request" drop column if exists "order_id", drop column if exists "payment_collection_id", drop column if exists "payment_provider", drop column if exists "payment_status", drop column if exists "paypal_order_id", drop column if exists "paypal_capture_id", drop column if exists "payment_authorized_at", drop column if exists "payment_captured_at";`
    )
  }
}
