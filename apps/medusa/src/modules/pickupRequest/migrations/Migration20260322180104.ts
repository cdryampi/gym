import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260322180104 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "pickup_request" drop constraint if exists "pickup_request_cart_id_unique";`);
    this.addSql(`alter table if exists "pickup_request" drop constraint if exists "pickup_request_request_number_unique";`);
    this.addSql(`create table if not exists "pickup_request" ("id" text not null, "request_number" text not null, "cart_id" text not null, "customer_id" text null, "supabase_user_id" text null, "email" text not null, "notes" text null, "status" text check ("status" in ('requested', 'confirmed', 'ready_for_pickup', 'fulfilled', 'cancelled')) not null default 'requested', "currency_code" text not null, "item_count" integer not null, "subtotal" real not null, "total" real not null, "line_items_snapshot" jsonb not null, "source" text not null default 'gym-storefront', "email_status" text check ("email_status" in ('pending', 'sent', 'failed')) not null default 'pending', "email_sent_at" timestamptz null, "email_error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pickup_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pickup_request_request_number_unique" ON "pickup_request" ("request_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pickup_request_cart_id_unique" ON "pickup_request" ("cart_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pickup_request_deleted_at" ON "pickup_request" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pickup_request" cascade;`);
  }

}
