import type { Metadata } from 'next';
import HeroSection from '@/components/marketing/HeroSection';
import FeaturesSection from '@/components/marketing/FeaturesSection';
import JourneySection from '@/components/marketing/JourneySection';
import CtaSection from '@/components/marketing/CtaSection';

export const metadata: Metadata = {
  title: '2bReady — Compliance Readiness Platform',
  description: 'Guided compliance readiness for businesses',
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <JourneySection />
      <CtaSection />
    </>
  );
}
