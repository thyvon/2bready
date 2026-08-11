import type { Metadata } from 'next';
import HeroSection from '@/components/marketing/HeroSection';
import StatsStrip from '@/components/marketing/StatsStrip';
import PortfolioSection from '@/components/marketing/PortfolioSection';
import StakeholdersSection from '@/components/marketing/StakeholdersSection';
import PricingSection from '@/components/marketing/PricingSection';
import EcosystemSection from '@/components/marketing/HowItWorksSection';
import CtaSection from '@/components/marketing/CtaSection';

export const metadata: Metadata = {
  title: '2bReady — Compliance Readiness Platform',
  description: 'Guided compliance readiness for businesses',
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <PortfolioSection />
      <StakeholdersSection />
      <PricingSection />
      <EcosystemSection />
      <CtaSection />
    </>
  );
}