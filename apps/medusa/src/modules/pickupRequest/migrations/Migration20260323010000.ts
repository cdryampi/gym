import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260323010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "pickup_request" add column if not exists "charged_currency_code" text null, add column if not exists "charged_total" double precision null, add column if not exists "exchange_rate" double precision null, add column if not exists "exchange_rate_source" text null, add column if not exists "exchange_rate_reference" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "pickup_request" drop column if exists "charged_currency_code", drop column if exists "charged_total", drop column if exists "exchange_rate", drop column if exists "exchange_rate_source", drop column if exists "exchange_rate_reference";`
    )
  }
}
