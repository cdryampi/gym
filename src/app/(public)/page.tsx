import type { Metadata } from "next";

import ContactSection from "@/components/marketing/ContactSection";
import FloatingWhatsAppButton from "@/components/marketing/FloatingWhatsAppButton";
import HeroSection from "@/components/marketing/HeroSection";
import PlansSection from "@/components/marketing/PlansSection";
import ProductsSection from "@/components/marketing/ProductsSection";
import ScheduleSection from "@/components/marketing/ScheduleSection";
import TeamSection from "@/components/marketing/TeamSection";
import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import TrainingZonesSection from "@/components/marketing/TrainingZonesSection";
import ValueSection from "@/components/marketing/ValueSection";
import { getMarketingData } from "@/lib/data/site";
import { buildMarketingMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getMarketingData();
  return buildMarketingMetadata(settings);
}

export default async function PublicHomePage() {
  const { settings, plans, scheduleRows, testimonials } = await getMarketingData();

  return (
    <div className="bg-[#151518]">
      <HeroSection settings={settings} />
      <FloatingWhatsAppButton settings={settings} />
      <ValueSection />
      <PlansSection settings={settings} plans={plans} />
      <ScheduleSection rows={scheduleRows} />
      <TeamSection />
      <ProductsSection />
      <TestimonialsSection testimonials={testimonials} />
      <TrainingZonesSection />
      <ContactSection settings={settings} />
    </div>
  );
}
