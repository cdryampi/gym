import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://novaforza.pe"),
  title: {
    default: "Nova Forza | Lima",
    template: "%s | Nova Forza",
  },
  description:
    "El gimnasio de fuerza de referencia en Lima. Resultados reales con asesoría personalizada.",
  icons: {
    icon: "/images/favicon/ico.png",
    shortcut: "/images/favicon/ico.png",
    apple: "/images/favicon/ico.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${oswald.variable} bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
