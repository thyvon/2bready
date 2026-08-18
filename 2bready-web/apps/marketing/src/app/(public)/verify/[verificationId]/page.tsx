import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import VerifiedIcon from '@mui/icons-material/Verified';
import BrandMark from '@/components/marketing/BrandMark';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface VerifyPayload {
  audit_id: string;
  level: string;
  company_name: string;
  company_name_kh: string | null;
  issued_at: string | null;
  score: string | null;
  pdf_url: string;
  qr_payload_url: string;
  master_verifier_stamp: Array<Record<string, unknown>> | Record<string, unknown>;
}

async function fetchCertificate(auditId: string): Promise<VerifyPayload> {
  const res = await fetch(`${API_URL}/api/v1/public/verify/${auditId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 404) notFound();
    throw new Error(`Failed to verify certificate (HTTP ${res.status})`);
  }

  const body = (await res.json()) as { data: VerifyPayload | null };
  if (!body.data) notFound();
  return body.data;
}

export async function generateMetadata({ params }: { params: Promise<{ verificationId: string }> }): Promise<Metadata> {
  const { verificationId } = await params;
  try {
    const data = await fetchCertificate(verificationId);
    return {
      title: `${data.company_name} — 2bReady Trust Verification`,
      description: `Verified compliance certificate for ${data.company_name}.`,
    };
  } catch {
    return { title: '2bReady Trust Verification' };
  }
}

// Parses the master_verifier_stamp (seeded as {verified_by, approved_by,
// prepared_by} — always object-shaped) defensively, since the OpenAPI type
// maps it to an opaque array/record union.
function stampLabel(key: string): string {
  switch (key) {
    case 'verified_by':
      return 'Verified by';
    case 'approved_by':
      return 'Approved by';
    case 'prepared_by':
      return 'Prepared by';
    default:
      return key;
  }
}

function stampEntries(stamp: VerifyPayload['master_verifier_stamp']): Array<[string, string]> {
  if (!stamp || typeof stamp !== 'object' || Array.isArray(stamp)) return [];
  return Object.entries(stamp)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([key, value]) => [stampLabel(key), value]);
}

export default async function VerifyPage({ params }: { params: Promise<{ verificationId: string }> }) {
  const { verificationId } = await params;
  const data = await fetchCertificate(verificationId);
  const stampEntriesList = stampEntries(data.master_verifier_stamp);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.10), transparent 55%), linear-gradient(180deg, #f8fafc, #ffffff)',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 24px 60px rgba(2, 40, 25, 0.12)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ bgcolor: 'success.main', py: 3.5, textAlign: 'center', color: 'success.contrastText' }}>
            <VerifiedIcon sx={{ fontSize: 44, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Verified Certificate
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Certified on the 2bReady compliance-readiness platform
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <BrandMark />
            </Box>

            <Typography variant="h5" align="center" sx={{ fontWeight: 700 }}>
              {data.company_name}
            </Typography>
            {data.company_name_kh && (
              <Typography variant="h6" align="center" sx={{ fontFamily: 'var(--font-kantumruy)', color: 'text.secondary', mt: 0.5 }}>
                {data.company_name_kh}
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
              <Chip
                color="success"
                variant="outlined"
                label={`Level ${data.level}`}
                sx={{ borderRadius: '999px', fontWeight: 600, px: 1 }}
              />
            </Box>

            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Audit ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>
                  {data.audit_id}
                </Typography>
              </Box>
              {data.score !== null && data.score !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Compliance score
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {data.score}
                  </Typography>
                </Box>
              )}
              {data.issued_at && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Issued
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(data.issued_at).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Stack>

            {stampEntriesList.length > 0 && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                {stampEntriesList.map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
<Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right' }}>
                    {value}
                  </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Button
              component="a"
              href={data.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ mt: 3, borderRadius: 2, py: 1.25 }}
            >
              Download Certificate PDF
            </Button>

            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 2 }}>
              This page confirms the certification status publicly. No documents or company data beyond this
              certificate are shown. Verify by scanning the QR code on the certificate.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}