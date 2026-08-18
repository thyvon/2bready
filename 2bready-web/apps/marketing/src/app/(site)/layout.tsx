import MarketingHeader from '@/components/layouts/MarketingHeader';
import MarketingFooter from '@/components/layouts/MarketingFooter';

// Every public marketing route with the full brand chrome (home, sections,
// and any future landing pages) lives under this group. The (public) group —
// the certificate verification page /verify/[verificationId] — is a sibling
// that deliberately opts out of header/footer entirely: a verifier scanning
// a QR code should land on a clean, focused status page, not the marketing
// site navigation (v3 §1.5).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </>
  );
}