import type { Metadata } from 'next';
import HeroSection from '@/components/marketing/HeroSection';
import PortfolioSection from '@/components/marketing/PortfolioSection';
import StakeholdersSection from '@/components/marketing/StakeholdersSection';
import FeaturesSection from '@/components/marketing/FeaturesSection';
import JourneySection from '@/components/marketing/JourneySection';
import PricingSection from '@/components/marketing/PricingSection';
import EcosystemSection from '@/components/marketing/EcosystemSection';
import CtaSection from '@/components/marketing/CtaSection';

export const metadata: Metadata = {
  title: '2bReady — Compliance Readiness Platform',
  description: 'Guided compliance readiness for businesses',
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <PortfolioSection />
      <StakeholdersSection />
      <FeaturesSection />
      <JourneySection />
      <PricingSection />
      <EcosystemSection />
      <CtaSection />
    </>
  );
}