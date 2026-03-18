import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno desde el directorio raíz y apps/medusa
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL no encontrada en las variables de entorno.');
  process.exit(1);
}

const migrations = [
  'supabase/migrations/202603170001_harden_admin_rls.sql',
  'supabase/migrations/202603170002_create_products_table.sql',
  'supabase/migrations/202603170003_expand_products_for_storefront_pdp.sql',
  'supabase/migrations/202603170004_store_categories_and_product_links.sql',
  'supabase/seed.sql'
];

async function runMigration() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a la base de datos Supabase.');

    // Diagnóstico de tipos
    const typeInfo = await client.query(`
      SELECT t.typname, t.typtype, e.enumlabel
      FROM pg_type t
      LEFT JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('product_category', 'product_stock_status')
    `);
    // Forzar la recreación de los tipos si hay discrepancias
    console.log('Verificando consistencia de tipos...');
    const dropTypes = `
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_category') THEN
          DROP TABLE public.product_category CASCADE;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
          DROP TABLE public.products CASCADE;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category' AND typtype != 'e') THEN
          DROP TYPE public.product_category CASCADE;
        END IF;
      END $$;
    `;
    await client.query(dropTypes);

    for (const migrationPath of migrations) {
      const fullPath = path.join(process.cwd(), migrationPath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Archivo no encontrado: ${migrationPath}`);
        continue;
      }

      console.log(`Aplicando: ${migrationPath}...`);
      const sqlContent = fs.readFileSync(fullPath, 'utf8');

      if (migrationPath.includes('0002_create_products_table.sql')) {
        // Ejecutar solo la creación de tabla, saltar el seed del SQL
        const parts = sqlContent.split('-- Seed Data');
        const schemaPart = parts[0];
        
        const statements = schemaPart.split(/;(?=(?:[^'$]*'[^'$]*')*[^'$]*$)/);
        for (let stmt of statements) {
          stmt = stmt.trim();
          if (!stmt) continue;
          await client.query(stmt).catch(e => {
            if (!e.message.includes('already exists')) throw e;
          });
        }

        // Seeding manual con parámetros
        const seedProducts = [
          {
            slug: 'creatina-monohidratada-300g',
            name: 'Creatina Monohidratada 300 g',
            category: 'suplementos',
            short_description: 'Soporte diario para fuerza, potencia y mejor recuperación entre sesiones exigentes.',
            description: 'Creatina monohidratada micronizada, fácil de disolver y pensada para quien entrena con constancia. Una opción simple y efectiva para acompañar fases de fuerza, hipertrofia o rendimiento general sin fórmulas innecesarias.',
            price: 24.90,
            currency: 'EUR',
            stock_status: 'in_stock',
            featured: true,
            pickup_only: true,
            pickup_note: 'Recogida rápida en recepción durante el horario del club.',
            images: ['/images/products/product-2.png'],
            tags: ['Fuerza', 'Recuperación', 'Uso diario'],
            highlights: ['300 g de creatina monohidratada micronizada.', 'Formato cómodo para ciclos largos o mantenimiento.', 'Fácil de combinar con tu rutina postentrenamiento.'],
            cta_label: 'Disponible en tienda',
            order: 1,
            active: true
          },
          {
            slug: 'whey-protein-isolate-2kg',
            name: 'Whey Protein Isolate 2 kg',
            category: 'suplementos',
            short_description: 'Proteína aislada de digestión ligera para cubrir la ingesta diaria sin complicaciones.',
            description: 'Aislado de suero pensado para socios que buscan una proteína limpia, cómoda y fácil de integrar en días de entrenamiento o recuperación. Perfil suave, textura fluida y una fórmula enfocada en rendimiento, no en artificios.',
            price: 64.90,
            currency: 'EUR',
            stock_status: 'low_stock',
            featured: true,
            pickup_only: true,
            pickup_note: 'Últimas unidades disponibles esta semana en el mostrador de Nova Forza.',
            images: ['/images/products/product-1.png'],
            tags: ['Recuperación', 'Proteína', 'Postentreno'],
            highlights: ['2 kg de proteína aislada de suero.', 'Ideal para cubrir requerimientos diarios sin pesadez.', 'Formato pensado para uso recurrente en fases de volumen o definición.'],
            cta_label: 'Consulta por WhatsApp',
            order: 2,
            active: true
          },
          {
            slug: 'shaker-premium-nova-forza',
            name: 'Shaker Premium Nova Forza',
            category: 'accesorios',
            short_description: 'Shaker robusto de 700 ml con cierre seguro y diseño limpio para el día a día.',
            description: 'Un básico bien resuelto para llevar proteína, creatina o bebida isotónica sin fugas ni piezas incómodas. Tiene cuerpo sólido, tapa firme y una presencia alineada con la estética de Nova Forza.',
            price: 14.90,
            currency: 'EUR',
            stock_status: 'in_stock',
            featured: false,
            pickup_only: true,
            pickup_note: 'Disponible para recogida inmediata en el club.',
            images: ['/images/products/product-5.png'],
            tags: ['Hidratación', 'Entreno', 'Nova Forza'],
            highlights: ['Capacidad de 700 ml.', 'Cierre seguro para mochila o taquilla.', 'Acabado limpio y fácil de lavar.'],
            cta_label: 'Disponible en tienda',
            order: 3,
            active: true
          },
          {
            slug: 'straps-de-levantamiento-pro',
            name: 'Straps de Levantamiento Pro',
            category: 'accesorios',
            short_description: 'Agarre extra para series pesadas de peso muerto, remos y tirones controlados.',
            description: 'Straps diseñados para entrenamientos serios donde el agarre limita antes que la espalda o la cadena posterior. Construcción resistente, ajuste cómodo y una sensación firme para cargas altas.',
            price: 16.90,
            currency: 'EUR',
            stock_status: 'in_stock',
            featured: true,
            pickup_only: true,
            pickup_note: 'Recógelos en recepción y pruébalos el mismo día en sala.',
            images: ['/images/products/product-8.png'],
            tags: ['Fuerza', 'Powerlifting', 'Agarre'],
            highlights: ['Tejido resistente con tacto firme.', 'Pensados para tirones pesados y trabajo de espalda.', 'Fáciles de guardar en mochila o cinturón.'],
            cta_label: 'Reservar en local',
            order: 4,
            active: true
          },
          {
            slug: 'polo-tecnico-nova-forza',
            name: 'Polo Técnico Nova Forza',
            category: 'merchandising',
            short_description: 'Prenda ligera de corte deportivo con identidad limpia y presencia premium.',
            description: 'Polo técnico desarrollado para entrenar, moverse por el club o llevar fuera del gimnasio sin caer en una estética de merch genérica. Patronaje cómodo, tejido ligero y gráfica sobria.',
            price: 32.00,
            currency: 'EUR',
            stock_status: 'coming_soon',
            featured: true,
            pickup_only: false,
            pickup_note: null,
            images: ['/images/products/product-6.png'],
            tags: ['Merch', 'Nova Forza', 'Performance'],
            highlights: ['Tejido técnico ligero.', 'Corte limpio para entreno o uso casual.', 'Lanzamiento previsto para la próxima reposición.'],
            cta_label: 'Próximamente',
            order: 6,
            active: true
          }
        ];

        console.log("Insertando productos mediante parámetros...");
        for (const p of seedProducts) {
          const query = `
            INSERT INTO public.products (
              slug, name, category, short_description, description, 
              price, currency, stock_status, featured, pickup_only, 
              pickup_note, images, tags, highlights, cta_label, 
              "order", active
            ) VALUES ($1, $2, $3::public.product_category, $4, $5, $6, $7, $8::public.product_stock_status, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (slug) DO NOTHING
          `;
          const values = [
            p.slug, p.name, p.category, p.short_description, p.description, 
            p.price, p.currency, p.stock_status, p.featured, p.pickup_only, 
            p.pickup_note, p.images, p.tags, p.highlights, p.cta_label, 
            p.order, p.active
          ];
          await client.query(query, values);
        }
      } else {
        const statements = sqlContent.split(/;(?=(?:[^'$]*'[^'$]*')*[^'$]*$)/);
        for (let stmt of statements) {
          stmt = stmt.trim();
          if (!stmt) continue;
          try {
            await client.query(stmt);
          } catch (err: any) {
            if (!err.message.includes('already exists') && !err.message.includes('exists, skipping')) {
              console.error(`❌ Error en ${migrationPath}:`, err.message);
              throw err;
            } else {
                console.warn(`  Nota: Objeto ya existente en ${migrationPath}, saltando...`);
            }
          }
        }
      }
      console.log(`✅ ${migrationPath} aplicado con éxito.`);
    }

    console.log('\n--- VERIFICACIÓN FINAL ---');
    
    const productsCount = await client.query('SELECT count(*) FROM public.products');
    const categoriesCount = await client.query('SELECT count(*) FROM public.store_categories');
    
    console.log(`Categorías totales: ${categoriesCount.rows[0].count}`);
    console.log(`Productos totales: ${productsCount.rows[0].count}`);

    console.log('\n✅ Proceso completado satisfactoriamente.');
  } catch (error) {
    console.error('Fallo crítico durante la migración:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
