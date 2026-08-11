import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Reveal from './Reveal';
import { portfolioContent, portfolioClients, portfolioPartners } from './content';

export default function PortfolioSection() {
  // Triple the lists so the loop always has enough content to stay seamless,
  // even on wide screens or short lists.
  const clientsLoop = [...portfolioClients, ...portfolioClients, ...portfolioClients];
  const partnersLoop = [...portfolioPartners, ...portfolioPartners, ...portfolioPartners];

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { xs: 8, md: 10 } }}>
      <Box sx={{ px: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            color: 'text.primary',
            mb: 5,
            fontSize: { xs: '1.75rem', md: '2.25rem' },
          }}
        >
          {portfolioContent.title}
        </Typography>

        {/* Row 1 - clients, scrolls left */}
        <MarqueeRow items={clientsLoop} direction="left" variant="primary" />

        {/* Row 2 - partners, scrolls right */}
        <Box sx={{ mt: { xs: 1.5, md: 2.5 } }}>
          <MarqueeRow items={partnersLoop} direction="right" variant="secondary" />
        </Box>
      </Reveal>
      </Box>
    </Box>
  );
}

function MarqueeRow({
  items,
  direction,
  variant,
}: {
  items: string[];
  direction: 'left' | 'right';
  variant: 'primary' | 'secondary';
}) {
  const animationName = direction === 'left' ? 'portfolio-marquee-left' : 'portfolio-marquee-right';

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        '@keyframes portfolio-marquee-left': {
          from: { transform: 'translateX(0%)' },
          to: { transform: 'translateX(-33.3333%)' },
        },
        '@keyframes portfolio-marquee-right': {
          from: { transform: 'translateX(-33.3333%)' },
          to: { transform: 'translateX(0%)' },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: 'max-content',
          alignItems: 'center',
          animation: `${animationName} 40s linear infinite`,
          willChange: 'transform',
          '&:hover': {
            animationPlayState: 'paused',
          },
        }}
      >
        {items.map((name, i) => (
          <Box
            key={`${name}-${i}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              px: { xs: 3, md: 5 },
              ...(i !== 0 && {
                borderLeft: '1px solid',
                borderColor: 'divider',
              }),
            }}
          >
            <Typography
              component="span"
              sx={{
                whiteSpace: 'nowrap',
                userSelect: 'none',
                fontWeight: variant === 'primary' ? 600 : 500,
                fontSize: variant === 'primary' ? { xs: '1.35rem', md: '1.65rem' } : { xs: '1rem', md: '1.15rem' },
                letterSpacing: '0.01em',
                color: variant === 'primary' ? 'text.primary' : 'text.secondary',
                opacity: variant === 'primary' ? 0.65 : 0.45,
                transition: 'opacity 0.3s ease, color 0.3s ease',
                '&:hover': {
                  opacity: 1,
                  color: 'primary.main',
                },
              }}
            >
              {name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}