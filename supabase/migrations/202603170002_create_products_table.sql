-- Migration: Create Products Table and Seed Data
-- Date: 2026-03-17

-- Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
        CREATE TYPE public.product_category AS ENUM ('suplementos', 'accesorios', 'merchandising');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_stock_status') THEN
        CREATE TYPE public.product_stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'coming_soon');
    END IF;
END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category public.product_category NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PEN',
    stock_status public.product_stock_status NOT NULL DEFAULT 'in_stock',
    featured BOOLEAN NOT NULL DEFAULT false,
    pickup_only BOOLEAN NOT NULL DEFAULT true,
    pickup_note TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    highlights TEXT[] NOT NULL DEFAULT '{}',
    cta_label TEXT NOT NULL DEFAULT 'Disponible en tienda',
    active BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read-only access to active products"
    ON public.products
    FOR SELECT
    USING (active = true);

-- Admin policies (can be managed by authenticated users if needed, but keeping it simple for now)
-- Assuming admin access is handled via service role for now as per hardening migration

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Seed Data
INSERT INTO public.products (
    slug, name, category, short_description, description, 
    price, currency, stock_status, featured, pickup_only, 
    pickup_note, images, tags, highlights, cta_label, 
    "order", active
)
VALUES 
(
    'creatina-monohidratada-300g', 
    'Creatina Monohidratada 300 g', 
    'suplementos', 
    'Soporte diario para fuerza, potencia y mejor recuperación entre sesiones exigentes.',
    'Creatina monohidratada micronizada, fácil de disolver y pensada para quien entrena con constancia. Una opción simple y efectiva para acompañar fases de fuerza, hipertrofia o rendimiento general sin fórmulas innecesarias.',
    24.90, 
    'EUR', 
    'in_stock', 
    true, 
    true, 
    'Recogida rápida en recepción durante el horario del club.', 
    ARRAY['/images/products/product-2.png'], 
    ARRAY['Fuerza', 'Recuperación', 'Uso diario'], 
    ARRAY['300 g de creatina monohidratada micronizada.', 'Formato cómodo para ciclos largos o mantenimiento.', 'Fácil de combinar con tu rutina postentrenamiento.'],
    'Disponible en tienda',
    1,
    true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
    slug, name, category, short_description, description, 
    price, currency, stock_status, featured, pickup_only, 
    pickup_note, images, tags, highlights, cta_label, 
    "order", active
)
VALUES 
(
    'whey-protein-isolate-2kg', 
    'Whey Protein Isolate 2 kg', 
    'suplementos', 
    'Proteína aislada de digestión ligera para cubrir la ingesta diaria sin complicaciones.',
    'Aislado de suero pensado para socios que buscan una proteína limpia, cómoda y fácil de integrar en días de entrenamiento o recuperación. Perfil suave, textura fluida y una fórmula enfocada en rendimiento, no en artificios.',
    64.90, 
    'EUR', 
    'low_stock', 
    true, 
    true, 
    'Últimas unidades disponibles esta semana en el mostrador de Nova Forza.', 
    ARRAY['/images/products/product-1.png'], 
    ARRAY['Recuperación', 'Proteína', 'Postentreno'], 
    ARRAY['2 kg de proteína aislada de suero.', 'Ideal para cubrir requerimientos diarios sin pesadez.', 'Formato pensado para uso recurrente en fases de volumen o definición.'],
    'Consulta por WhatsApp',
    2,
    true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
    slug, name, category, short_description, description, 
    price, currency, stock_status, featured, pickup_only, 
    pickup_note, images, tags, highlights, cta_label, 
    "order", active
)
VALUES 
(
    'shaker-premium-nova-forza', 
    'Shaker Premium Nova Forza', 
    'accesorios', 
    'Shaker robusto de 700 ml con cierre seguro y diseño limpio para el día a día.',
    'Un básico bien resuelto para llevar proteína, creatina o bebida isotónica sin fugas ni piezas incómodas. Tiene cuerpo sólido, tapa firme y una presencia alineada con la estética de Nova Forza.',
    14.90, 
    'EUR', 
    'in_stock', 
    false, 
    true, 
    'Disponible para recogida inmediata en el club.', 
    ARRAY['/images/products/product-5.png'], 
    ARRAY['Hidratación', 'Entreno', 'Nova Forza'], 
    ARRAY['Capacidad de 700 ml.', 'Cierre seguro para mochila o taquilla.', 'Acabado limpio y fácil de lavar.'],
    'Disponible en tienda',
    3,
    true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
    slug, name, category, short_description, description, 
    price, currency, stock_status, featured, pickup_only, 
    pickup_note, images, tags, highlights, cta_label, 
    "order", active
)
VALUES 
(
    'straps-de-levantamiento-pro', 
    'Straps de Levantamiento Pro', 
    'accesorios', 
    'Agarre extra para series pesadas de peso muerto, remos y tirones controlados.',
    'Straps diseñados para entrenamientos serios donde el agarre limita antes que la espalda o la cadena posterior. Construcción resistente, ajuste cómodo y una sensación firme para cargas altas.',
    16.90, 
    'EUR', 
    'in_stock', 
    true, 
    true, 
    'Recógelos en recepción y pruébalos el mismo día en sala.', 
    ARRAY['/images/products/product-8.png'], 
    ARRAY['Fuerza', 'Powerlifting', 'Agarre'], 
    ARRAY['Tejido resistente con tacto firme.', 'Pensados para tirones pesados y trabajo de espalda.', 'Fáciles de guardar en mochila o cinturón.'],
    'Reservar en local',
    4,
    true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
    slug, name, category, short_description, description, 
    price, currency, stock_status, featured, pickup_only, 
    pickup_note, images, tags, highlights, cta_label, 
    "order", active
)
VALUES 
(
    'polo-tecnico-nova-forza', 
    'Polo Técnico Nova Forza', 
    'merchandising', 
    'Prenda ligera de corte deportivo con identidad limpia y presencia premium.',
    'Polo técnico desarrollado para entrenar, moverse por el club o llevar fuera del gimnasio sin caer en una estética de merch genérica. Patronaje cómodo, tejido ligero y gráfica sobria.',
    32.00, 
    'EUR', 
    'coming_soon', 
    true, 
    false, 
    NULL, 
    ARRAY['/images/products/product-6.png'], 
    ARRAY['Merch', 'Nova Forza', 'Performance'], 
    ARRAY['Tejido técnico ligero.', 'Corte limpio para entreno o uso casual.', 'Lanzamiento previsto para la próxima reposición.'],
    'Próximamente',
    6,
    true
)
ON CONFLICT (slug) DO NOTHING;
