/**
 * Marketing phase 2 remains intentionally out of scope for the current core closeout.
 * Keep team, testimonials, contact and support copy static here until a dedicated issue
 * moves them to Supabase-backed editable content.
 */
export interface NavItem {
  href: string;
  label: string;
}

export interface ValueProp {
  title: string;
  description: string;
  icon: "dumbbell" | "spark" | "shield" | "trend";
}

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

export interface FeaturedProduct {
  category: string;
  name: string;
  price: string;
  imageUrl: string;
}

export const novaForzaHomeContent = {
  navItems: [
    { href: "/#inicio", label: "Inicio" },
    { href: "/#planes", label: "Planes" },
    { href: "/#horarios", label: "Horarios" },
    { href: "/#entrenadores", label: "Entrenadores" },
    { href: "/tienda", label: "Tienda" },
    { href: "/#contacto", label: "Contacto" },
  ] satisfies NavItem[],
  valueProps: [
    {
      icon: "dumbbell",
      title: "Entrenamiento de fuerza",
      description: "Maquinas top y una zona de pesas bien puesta para que entrenes fuerte de verdad.",
    },
    {
      icon: "spark",
      title: "Acompanamiento real",
      description: "Coaches que estan contigo en cada serie para que avances bien y sin floro.",
    },
    {
      icon: "shield",
      title: "Ambiente serio",
      description: "Aqui vienes a meterle con foco, orden y un espacio cuidado de punta a punta.",
    },
    {
      icon: "trend",
      title: "Resultados que se notan",
      description: "Metodo claro para que veas cambios reales en fuerza, fisico y rendimiento.",
    },
  ] satisfies ValueProp[],
  team: [
    {
      name: "Carlos Mendoza",
      role: "Powerlifting & Hipertrofia",
      bio: "Ex-competidor nacional enfocado en mecanicas de levantamiento pesado y prevencion de lesiones.",
      imageUrl: "/images/trainers/trainer-1.png",
    },
    {
      name: "Elena Vargas",
      role: "Entrenamiento Funcional",
      bio: "Especialista en movilidad y acondicionamiento metabolico. Certificacion NASM.",
      imageUrl: "/images/trainers/trainer-2.png",
    },
    {
      name: "Ricardo Diaz",
      role: "Nutricion Deportiva",
      bio: "Experto en recomposicion corporal y diseno de planes alimenticios personalizados para atletas.",
      imageUrl: "/images/trainers/trainer-3.png",
    },
  ] satisfies TeamMember[],
  featuredProducts: [
    {
      category: "Proteina",
      name: "Whey Isolate Nuova Forza 2kg",
      price: "S/ 189.00",
      imageUrl: "/images/products/product-1.png",
    },
    {
      category: "Ropa",
      name: "T-Shirt Strength First Black",
      price: "S/ 65.00",
      imageUrl: "/images/products/product-6.png",
    },
    {
      category: "Fuerza",
      name: "Creatina Monohidratada 500g",
      price: "S/ 110.00",
      imageUrl: "/images/products/product-2.png",
    },
    {
      category: "Accesorios",
      name: "Shaker Pro Edicion Especial",
      price: "S/ 35.00",
      imageUrl: "/images/products/product-7.png",
    },
  ] satisfies FeaturedProduct[],
  contact: {
    address: "San Jose #371, segundo piso, Chiclayo",
    whatsappLabel: "WhatsApp de atencion",
    whatsappDisplay: "+51 901 900 300",
    emailLabel: "Consultas generales",
    email: "soporte@nuovaforzagym.com",
    mapLabel: "Chiclayo",
  },
  footerQuickLinks: [
    "Nuestra historia",
    "Metodologia",
    "Entrenamientos",
    "Membresias",
    "Tienda Online",
    "Preguntas frecuentes",
    "Politicas de privacidad",
    "Libro de reclamaciones",
  ],
  footerHours: [
    { label: "Lun - Vie:", value: "06:00 - 22:00" },
    { label: "Sabados:", value: "06:00 - 12:00" },
    { label: "Domingos:", value: "Cerrado" },
  ],
  socials: [
    { label: "IG", href: "https://instagram.com/gimnasionuovaforza" },
    { label: "FB", href: "https://facebook.com/GYM.NUOVAFORZA" },
  ] satisfies { label: string; href: string }[],
  acceptedPaymentMethods: [
    { id: "paypal", label: "PayPal", logoUrl: "/images/payments/paypal-white.svg" },
  ],
};
