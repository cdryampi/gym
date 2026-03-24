import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const enableInsecureDbSsl = process.env.MEDUSA_DB_INSECURE_SSL === "true"
const reservedPayPalSandboxConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
  autoCapture: process.env.PAYPAL_AUTO_CAPTURE === "true",
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
}
void reservedPayPalSandboxConfig

const paypalProviderOptions =
  process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    ? [
        {
          resolve: "./src/modules/paypal",
          id: "paypal",
          options: {
            client_id: process.env.PAYPAL_CLIENT_ID,
            client_secret: process.env.PAYPAL_CLIENT_SECRET,
            environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
            autoCapture:
              process.env.PAYPAL_AUTO_CAPTURE === undefined
                ? true
                : process.env.PAYPAL_AUTO_CAPTURE === "true",
            webhook_id: process.env.PAYPAL_WEBHOOK_ID,
            region_id: process.env.MEDUSA_REGION_ID,
            region_name: process.env.MEDUSA_REGION_NAME || "Peru",
          },
        },
      ]
    : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: enableInsecureDbSsl
      ? {
          connection: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        }
      : {},
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000,http://localhost:3001",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:9000,http://localhost:3001",
      authCors: process.env.AUTH_CORS || "http://localhost:7001,http://localhost:9000,http://localhost:3001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: {
    payment: {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/paypal",
            id: "paypal",
            options: {
              client_id: process.env.PAYPAL_CLIENT_ID,
              client_secret: process.env.PAYPAL_CLIENT_SECRET,
              environment: process.env.PAYPAL_ENVIRONMENT,
              webhook_id: process.env.PAYPAL_WEBHOOK_ID,
              region_id: process.env.MEDUSA_REGION_ID,
            },
          },
        ],
      },
    },
    file: {
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              region: process.env.S3_REGION || "us-central-1",
              bucket: process.env.S3_BUCKET || "medusa-media",
              endpoint: process.env.S3_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              forcePathStyle: true,
              s3ForcePathStyle: true,
            },
          },
        ],
      },
    },
    product: {
      resolve: "@medusajs/product",
      options: {},
    },
    pickupRequest: {
      resolve: "./src/modules/pickupRequest",
    },
  }
})
