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
    default: "Nova Forza",
    template: "%s | Nova Forza",
  },
  description:
    "Gimnasio premium local enfocado en fuerza, progreso real y asesoria cercana.",
  icons: {
    icon: "/images/favicon/favicon.jpg",
    shortcut: "/images/favicon/favicon.jpg",
    apple: "/images/favicon/favicon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${oswald.variable} bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
