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
    <Box component="section" sx={{ bgcolor: 'background.default', py: 'clamp(4rem, 2.5rem + 4.5vw, 6.5rem)' }}>
      <Box sx={{ px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)', maxWidth: 1440, mx: 'auto' }}>
      <Reveal>
        <Typography
          variant="overline"
          sx={{ display: 'block', textAlign: 'center', color: 'success.main', fontWeight: 800, letterSpacing: '0.14em', mb: 1.5 }}
        >
          {portfolioContent.kicker}
        </Typography>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            textAlign: 'center',
            textWrap: 'balance',
            fontWeight: 800,
            color: 'text.primary',
            mb: 'clamp(2.5rem, 1.5rem + 3vw, 4rem)',
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
              px: 'clamp(1.25rem, 0.75rem + 2vw, 2.25rem)',
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
                fontWeight: variant === 'primary' ? 800 : 700,
                fontSize: variant === 'primary'
                  ? 'clamp(1.125rem, 1rem + 0.8vw, 1.5rem)'
                  : 'clamp(0.9375rem, 0.875rem + 0.5vw, 1.125rem)',
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