import "dotenv/config";
import fs from "fs";
import path from "path";
import type { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

const DEFAULT_CURRENCY_CODE = (process.env.COMMERCE_CURRENCY_CODE ?? "PEN").toLowerCase();
const DEFAULT_REGION_NAME = process.env.MEDUSA_REGION_NAME ?? "Peru";
const DEFAULT_COUNTRY_CODE = (process.env.MEDUSA_COUNTRY_CODE ?? "PE").toLowerCase();
const DEFAULT_PAYMENT_PROVIDERS = [
  "pp_system_default",
  ...(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    ? ["pp_paypal_paypal"]
    : []),
];

type NovaForzaCategory = "suplementos" | "accesorios" | "merchandising";
type NovaForzaStockStatus = "in_stock" | "low_stock" | "out_of_stock" | "coming_soon";

interface NovaForzaSeedProduct {
  title: string;
  handle: string;
  category: NovaForzaCategory;
  subtitle: string;
  description: string;
  amount: number;
  compareAmount?: number;
  sku: string;
  inventory: number;
  metadata: {
    cta_label: string;
    discount_label?: string;
    display_options?: Array<{
      id?: string;
      title: string;
      values: string[];
    }>;
    benefits?: string[];
    featured: boolean;
    highlights: string[];
    eyebrow?: string;
    order: number;
    pickup_note?: string;
    pickup_eta?: string;
    pickup_only: boolean;
    pickup_summary?: string;
    short_description: string;
    specifications?: Array<{
      label: string;
      value: string;
    }>;
    stock_status: NovaForzaStockStatus;
    storefront_images: string[];
    tags: string[];
    usage_steps?: string[];
  };
}

const novaForzaProducts: NovaForzaSeedProduct[] = [
  {
    title: "Creatina Monohidratada 300 g",
    handle: "creatina-monohidratada-300g",
    category: "suplementos",
    subtitle: "Soporte diario para fuerza, potencia y mejor recuperacion entre sesiones exigentes.",
    description:
      "Creatina monohidratada micronizada, facil de disolver y pensada para quien entrena con constancia. Una opcion simple y efectiva para acompanar fases de fuerza, hipertrofia o rendimiento general sin formulas innecesarias.",
    amount: 2490,
    sku: "NOVA-CREATINA-300G",
    inventory: 24,
    metadata: {
      short_description:
        "Soporte diario para fuerza, potencia y mejor recuperacion entre sesiones exigentes.",
      featured: true,
      pickup_only: true,
      pickup_note: "Recogida rapida en recepcion durante el horario del club.",
      storefront_images: ["nova-creatina.png"],
      tags: ["Fuerza", "Recuperacion", "Uso diario"],
      highlights: [
        "300 g de creatina monohidratada micronizada.",
        "Formato comodo para ciclos largos o mantenimiento.",
        "Facil de combinar con tu rutina postentrenamiento.",
      ],
      cta_label: "Disponible en tienda",
      order: 1,
      stock_status: "in_stock",
    },
  },
  {
    title: "Nova Forza Isolate Whey Protein",
    handle: "whey-protein-isolate-2kg",
    category: "suplementos",
    subtitle: "Proteina aislada de digestion ligera para cubrir la ingesta diaria sin complicaciones.",
    description:
      "Maximiza tu recuperacion con nuestra formula de rapida absorcion. Disenada para atletas que buscan pureza absoluta: 25 g de proteina, 0 g de azucar y un perfil completo de aminoacidos para alimentar tu fuerza.",
    amount: 4999,
    compareAmount: 5899,
    sku: "NOVA-WHEY-ISOLATE-2KG",
    inventory: 4,
    metadata: {
      eyebrow: "Suplemento de elite",
      short_description:
        "Proteina aislada de digestion ligera para cubrir la ingesta diaria sin complicaciones.",
      featured: true,
      pickup_only: true,
      pickup_note: "Ultimas unidades disponibles esta semana en el mostrador de Nova Forza.",
      pickup_summary: "Recogida en Nova Forza Gym",
      pickup_eta:
        "Tu producto estara listo en recepcion in menos de 24 horas laborables. Presenta tu email de confirmacion.",
      storefront_images: ["nova-whey.png"],
      tags: ["Recuperacion", "Proteina", "Postentreno"],
      highlights: [
        "25 g de proteina por servicio.",
        "0 g de azucar and digestion comoda.",
        "Perfil premium for volumen or definicion.",
      ],
      benefits: [
        "Sintesis muscular acelerada.",
        "Pureza del 90% de proteina aislada.",
        "Facil digestion sin hinchazon.",
      ],
      usage_steps: [
        "Mezcla un servicio (30 g) con 250 ml de agua o leche fria.",
        "Agitar durante 30 segundos. Consumir preferiblemente despues del entrenamiento o entre comidas para mantener el anabolismo.",
      ],
      specifications: [
        { label: "Peso neto", value: "2 kg / 4.4 lbs" },
        { label: "Servicios", value: "66 aprox." },
        { label: "Origen", value: "Suiza" },
      ],
      display_options: [
        {
          id: "flavor",
          title: "Sabor",
          values: ["Chocolate Suizo", "Vanilla Bourbon", "Cookies & Cream"],
        },
      ],
      cta_label: "Reservar para recogida",
      discount_label: "Ahorra 15%",
      order: 2,
      stock_status: "low_stock",
    },
  },
  {
    title: "Shaker Premium Nova Forza",
    handle: "shaker-premium-nova-forza",
    category: "accesorios",
    subtitle: "Shaker robusto de 700 ml con cierre seguro and diseno limpio for el dia a dia.",
    description:
      "Un basico bien resuelto para llevar proteina, creatina o bebida isotonica sin fugas ni piezas incomodas. Tiene cuerpo solido, tapa firme and una presencia alineada con la estetica de Nova Forza.",
    amount: 1490,
    sku: "NOVA-SHAKER-700",
    inventory: 18,
    metadata: {
      short_description: "Shaker robusto de 700 ml con cierre seguro and diseno limpio for el dia a dia.",
      featured: false,
      pickup_only: true,
      pickup_note: "Disponible para recogida inmediata en el club.",
      storefront_images: ["nova-shaker.png"],
      tags: ["Hidratacion", "Entreno", "Nova Forza"],
      highlights: [
        "Capacidad of 700 ml.",
        "Cierre seguro para mochila o taquilla.",
        "Acabado limpio and facil de lavar.",
      ],
      cta_label: "Disponible en tienda",
      order: 3,
      stock_status: "in_stock",
    },
  },
  {
    title: "Straps de Levantamiento Pro",
    handle: "straps-de-levantamiento-pro",
    category: "accesorios",
    subtitle: "Agarre extra for series pesadas de peso muerto, remos and tirones controlados.",
    description:
      "Straps disenados para entrenamientos serios where the agarre limita antes que la espalda o la cadena posterior. Construccion resistente, ajuste comodo and una sensacion firme for cargas altas.",
    amount: 1690,
    sku: "NOVA-STRAPS-PRO",
    inventory: 9,
    metadata: {
      short_description:
        "Agarre extra for series pesadas de peso muerto, remos and tirones controlados.",
      featured: true,
      pickup_only: true,
      pickup_note: "Recogelos en recepcion y pruebalo el mismo dia en sala.",
      storefront_images: ["nova-straps.png"],
      tags: ["Fuerza", "Powerlifting", "Agarre"],
      highlights: [
        "Tejido resistente with tacto firme.",
        "Pensados for tirones pesados and trabajo de espalda.",
        "Faciles de guardar in mochila or cinturon.",
      ],
      cta_label: "Reservar en local",
      order: 4,
      stock_status: "in_stock",
    },
  },
  {
    title: "Guantes de Entrenamiento Nova",
    handle: "guantes-entrenamiento-nova",
    category: "accesorios",
    subtitle: "Proteccion y agarre superior con materiales transpirables y refuerzo en palma.",
    description:
      "Guantes tecnicos para sesiones de alto volumen. Protegen la mano sin sacrificar la movilidad ni el tacto con la barra. Ajuste ergonomico y durabilidad industrial.",
    amount: 1990,
    sku: "NOVA-GUANTES-PRO",
    inventory: 12,
    metadata: {
      short_description: "Proteccion y agarre superior con materiales transpirables y refuerzo en palma.",
      featured: false,
      pickup_only: true,
      pickup_note: "Disponibles en varias tallas en el club.",
      storefront_images: ["nova-guantes.png"],
      tags: ["Proteccion", "Entreno", "Accesorios"],
      highlights: [
        "Material transpirable de alta calidad.",
        "Refuerzo acolchado en zonas de mayor presion.",
        "Cierre de velcro ajustable.",
      ],
      cta_label: "Disponible en tienda",
      order: 5,
      stock_status: "in_stock",
    },
  },
  {
    title: "Polo Tecnico Nova Forza",
    handle: "polo-tecnico-nova-forza",
    category: "merchandising",
    subtitle: "Prenda ligera de corte deportivo with identidad limpia and presencia premium.",
    description:
      "Polo tecnico desarrollado para entrenar, moverse por el club o llevar fuera del gimnasio sin caer en una estetica de merch generica. Patronaje comodo, tejido ligero and grafica sobria.",
    amount: 3200,
    sku: "NOVA-POLO-TECH",
    inventory: 5,
    metadata: {
      short_description: "Prenda ligera de corte deportivo with identidad limpia and presencia premium.",
      featured: true,
      pickup_only: true,
      storefront_images: ["nova-polo.png"],
      tags: ["Merch", "Nova Forza", "Performance"],
      highlights: [
        "Tejido tecnico ligero.",
        "Corte limpio for entreno or uso casual.",
        "Disponible en tallas S, M, L y XL.",
      ],
      cta_label: "Reservar en local",
      order: 6,
      stock_status: "in_stock",
    },
  },
  {
    title: "Botella Termica Nova",
    handle: "botella-termica-nova",
    category: "accesorios",
    subtitle: "Mantiene la temperatura durante todo el entreno con un diseño industrial elegante.",
    description:
      "Botella de acero inoxidable con doble pared. Residistente, sobria y diseñada para durar años. El complemento perfecto para mantenerte hidratado con estilo.",
    amount: 2250,
    sku: "NOVA-BOTELLA-THERM",
    inventory: 15,
    metadata: {
      short_description: "Mantiene la temperatura durante todo el entreno con un diseño industrial elegante.",
      featured: false,
      pickup_only: true,
      storefront_images: ["nova-botella.png"],
      tags: ["Hidratacion", "Premium", "Accesorios"],
      highlights: [
        "Acero inoxidable de grado alimenticio.",
        "Aislamiento térmico de larga duración.",
        "Acabado negro mate anti-deslizante.",
      ],
      cta_label: "Disponible en tienda",
      order: 7,
      stock_status: "in_stock",
    },
  },
  {
    title: "Banda Elastica de Tela Nova",
    handle: "banda-elastica-tela-nova",
    category: "accesorios",
    subtitle: "Resistencia premium sin deslizamientos, ideal para glúteo y pierna.",
    description:
      "Banda de resistencia fabricada en tela técnica de alta durabilidad. A diferencia del látex, no se enrolla ni pellizca. Nivel de resistencia medio-alto.",
    amount: 1290,
    sku: "NOVA-BANDA-TEXTIL",
    inventory: 20,
    metadata: {
      short_description: "Resistencia premium sin deslizamientos, ideal para glúteo y pierna.",
      featured: false,
      pickup_only: true,
      storefront_images: ["nova-banda.png"],
      tags: ["Entrenamiento", "Pierna", "Accesorios"],
      highlights: [
        "Tejido suave que no irrita la piel.",
        "Agarre interno de silicona antideslizante.",
        "Lavable y extremadamente resistente.",
      ],
      cta_label: "Disponible en tienda",
      order: 8,
      stock_status: "in_stock",
    },
  },
] as NovaForzaSeedProduct[];

async function ensureDefaultSalesChannel(container: ExecArgs["container"]) {
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const existing = await salesChannelService.listSalesChannels({
    name: "Nova Forza Storefront",
  });

  if (existing.length > 0) {
    return existing[0];
  }

  const { result } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Nova Forza Storefront",
        },
      ],
    },
  });

  return result[0];
}

async function ensurePublishableApiKey(container: ExecArgs["container"], salesChannelId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token"],
    filters: {
      type: "publishable",
    },
  });

  const existing = data?.find((entry: { id: string; title?: string; token?: string }) => entry.title === "Nova Forza Storefront");

  if (existing) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: existing.id,
        add: [salesChannelId],
      },
    });

    return existing.token;
  }

  const {
    result: [apiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Nova Forza Storefront",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: apiKey.id,
      add: [salesChannelId],
    },
  });

  return apiKey.token;
}

async function uploadProductImages(container: ExecArgs["container"], products: NovaForzaSeedProduct[]) {
  const fileModuleService = container.resolve(Modules.FILE);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  
  const s3Url = process.env.S3_URL?.replace("/s3", "") || "https://nbjkfyjeewprnxxibhwz.supabase.co/storage/v1";
  const s3Bucket = process.env.S3_BUCKET || "medusa-media";
  const s3AccessKey = process.env.S3_ACCESS_KEY_ID;
  
  // Use absolute path to Next.js public/images/products
  const imagesDir = path.resolve(process.cwd(), "../../public/images/products");
  
  const imageMap = new Map<string, string>();
  const isS3Configured = s3AccessKey && s3AccessKey !== "tu_access_key";
  
  if (!isS3Configured) {
    logger.warn("S3 Credentials not found or placeholder. Skipping actual upload but generating fallback URLs.");
  }

  for (const product of products) {
    for (const localPath of product.metadata.storefront_images) {
      const fileName = localPath.split("/").pop();
      if (!fileName || imageMap.has(fileName)) continue;
      
      const fallbackUrl = `/images/products/${fileName}`;
      
      if (!isS3Configured) {
        imageMap.set(fileName, fallbackUrl);
        continue;
      }

      const filePath = path.join(imagesDir, fileName);
      if (!fs.existsSync(filePath)) {
        logger.warn(`Image file not found: ${filePath}. Using fallback.`);
        imageMap.set(fileName, fallbackUrl);
        continue;
      }
      
      try {
        const fileContent = fs.readFileSync(filePath);
        const file = await fileModuleService.createFiles({
          filename: fileName,
          mimeType: "image/png",
          content: fileContent.toString("base64"),
          access: "public",
        });
        
        imageMap.set(fileName, file.url);
        logger.info(`Uploaded image: ${fileName} -> ${file.url}`);
      } catch (error) {
        logger.error(`Failed to upload image ${fileName}: ${error.message}. Using fallback.`);
        imageMap.set(fileName, fallbackUrl);
      }
    }
  }
  
  return imageMap;
}

export default async function seedNovaForzaData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const storeModuleService = container.resolve(Modules.STORE);

  logger.info("Seeding Nova Forza commerce foundation...");

  const [store] = await storeModuleService.listStores();
  const salesChannel = await ensureDefaultSalesChannel(container);

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: DEFAULT_CURRENCY_CODE,
            is_default: true,
          },
        ],
        default_sales_channel_id: salesChannel.id,
      },
    },
  });

  const regionQuery = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: existingRegions } = await regionQuery.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: DEFAULT_REGION_NAME }
  });

  let region: any = existingRegions?.[0];

  if (!region) {
    const { result: regions } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: DEFAULT_REGION_NAME,
            currency_code: DEFAULT_CURRENCY_CODE,
            countries: [DEFAULT_COUNTRY_CODE],
            payment_providers: DEFAULT_PAYMENT_PROVIDERS,
          },
        ],
      },
    });
    region = regions[0];
  }

  const { result: stockLocations } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Nova Forza Club",
          address: {
            city: "Barcelona",
            country_code: "ES",
            address_1: "Recepcion Nova Forza",
          },
        },
      ],
    },
  });

  const stockLocation = stockLocations[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [salesChannel.id],
    },
  });

  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });

  let shippingProfile = shippingProfiles[0];

  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "Nova Forza Pickup",
            type: "default",
          },
        ],
      },
    });

    shippingProfile = result[0];
  }

  const { data: existingCategories } = await regionQuery.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  });

  const categoriesToCreate = [
    { name: "Suplementos" },
    { name: "Accesorios" },
    { name: "Merchandising" },
  ].filter(c => !existingCategories.some((ec: any) => ec.name === c.name));

  let createdCategories: any[] = [...existingCategories];

  if (categoriesToCreate.length > 0) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: categoriesToCreate.map(c => ({ ...c, is_active: true })),
      },
    });
    createdCategories = [...createdCategories, ...result];
  }

  const categoryByHandle = new Map(
    createdCategories.map((category) => [category.handle ?? category.name.toLowerCase(), category.id]),
  );

  console.log("Categories mapped:", Array.from(categoryByHandle.entries()));
  console.log("Shipping Profile:", shippingProfile?.id);
  console.log("Region ID:", region?.id);
  console.log("Sales Channel ID:", salesChannel?.id);

  logger.info("Uploading product images to storage provider...");
  const uploadedImageMap = await uploadProductImages(container, novaForzaProducts);
  
  const { data: existingProducts } = await regionQuery.graph({
    entity: "product",
    fields: ["id", "handle"],
  });

  const productsToCreate = novaForzaProducts.filter(
    (product) => !existingProducts.some((ep: any) => ep.handle === product.handle)
  );

  if (productsToCreate.length > 0) {
    await createProductsWorkflow(container).run({
      input: {
        products: productsToCreate.map((product) => ({
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          handle: product.handle,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [categoryByHandle.get(product.category)!],
          options: [
            {
              title: "Talla",
              values: ["Unica"],
            },
          ],
          variants: [
            {
              title: "Default",
              sku: product.sku,
              manage_inventory: true,
              options: {
                Talla: "Unica",
              },
              prices: [
                {
                  amount: product.amount,
                  currency_code: DEFAULT_CURRENCY_CODE,
                },
              ],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
          images: product.metadata.storefront_images.map(img => {
              const fileName = img.split("/").pop()!;
              return { url: uploadedImageMap.get(fileName) || img };
          }),
          metadata: {
            ...product.metadata,
            category: product.category,
            compare_price: product.compareAmount ? product.compareAmount / 100 : null,
            region_id: region.id,
          },
        })),
      },
    });
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];

  for (const inventoryItem of inventoryItems ?? []) {
    const matchingProduct = novaForzaProducts.find((product) => product.sku === inventoryItem.sku);

    if (!matchingProduct) {
      continue;
    }

    inventoryLevels.push({
      location_id: stockLocation.id,
      stocked_quantity: matchingProduct.inventory,
      inventory_item_id: inventoryItem.id,
    });
  }

  if (inventoryLevels.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevels,
      },
    });
  }

  const publishableKeyId = await ensurePublishableApiKey(container, salesChannel.id);

  console.log("Nova Forza Medusa seed completed.");
  console.log(`Region ready for storefront price lookup: ${region.id}`);
  console.log(`Publishable API key linked to storefront sales channel: ${publishableKeyId}`);
}
