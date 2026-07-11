import type { Metadata } from 'next';
import HeroSection from '@/components/marketing/HeroSection';
import PortfolioSection from '@/components/marketing/PortfolioSection';
import StakeholdersSection from '@/components/marketing/StakeholdersSection';
import PricingSection from '@/components/marketing/PricingSection';
import EcosystemSection from '@/components/marketing/HowItWorksSection';

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
      <PricingSection />
      <EcosystemSection />
    </>
  );
}