const fs = require("node:fs")
const path = require("node:path")
const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const enableInsecureDbSsl = process.env.MEDUSA_DB_INSECURE_SSL === "true"
const hasPayPalCredentials =
  Boolean(process.env.PAYPAL_CLIENT_ID) && Boolean(process.env.PAYPAL_CLIENT_SECRET)

function resolveInternalModulePath(moduleName) {
  const compiledPath = path.join(process.cwd(), ".medusa", "server", "src", "modules", moduleName)

  if (fs.existsSync(compiledPath)) {
    return compiledPath
  }

  return `./src/modules/${moduleName}`
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
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
      adminCors:
        process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:9000,http://localhost:3001",
      authCors:
        process.env.AUTH_CORS || "http://localhost:7001,http://localhost:9000,http://localhost:3001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: {
    payment: {
      resolve: "@medusajs/payment",
      options: {
        providers: hasPayPalCredentials
          ? [
              {
                resolve: resolveInternalModulePath("paypal"),
                id: "paypal",
                options: {
                  client_id: process.env.PAYPAL_CLIENT_ID,
                  client_secret: process.env.PAYPAL_CLIENT_SECRET,
                  environment: process.env.PAYPAL_ENVIRONMENT,
                  webhook_id: process.env.PAYPAL_WEBHOOK_ID,
                  region_id: process.env.MEDUSA_REGION_ID,
                },
              },
            ]
          : [],
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
      resolve: resolveInternalModulePath("pickupRequest"),
    },
  },
})
