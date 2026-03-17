import type { Metadata } from "next";

import ContactSection from "@/components/marketing/ContactSection";
import HeroSection from "@/components/marketing/HeroSection";
import PlansSection from "@/components/marketing/PlansSection";
import ProductsSection from "@/components/marketing/ProductsSection";
import ScheduleSection from "@/components/marketing/ScheduleSection";
import SiteFooter from "@/components/marketing/SiteFooter";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteTopbar from "@/components/marketing/SiteTopbar";
import TeamSection from "@/components/marketing/TeamSection";
import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import TrainingZonesSection from "@/components/marketing/TrainingZonesSection";
import ValueSection from "@/components/marketing/ValueSection";
import { getCurrentMemberUser } from "@/lib/auth";
import { getMarketingData } from "@/lib/data/site";
import { buildMarketingMetadata } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getMarketingData();
  return buildMarketingMetadata(settings);
}

export default async function PublicHomePage() {
  const { settings, warning } = await getMarketingData();
  const currentUser = await getCurrentMemberUser();

  return (
    <div className="min-h-screen bg-[#151518]">
      <div className="sticky top-0 z-50">
        <SiteTopbar settings={settings} />
        <SiteHeader settings={settings} currentUser={currentUser} />
      </div>
      <main>
        <HeroSection settings={settings} />
        <ValueSection warning={warning} />
        <PlansSection settings={settings} />
        <ScheduleSection />
        <TeamSection />
        <ProductsSection />
        <TestimonialsSection />
        <TrainingZonesSection />
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
