import Box from '@mui/material/Box';
import ShieldIcon from '@mui/icons-material/Shield';

const SECURE_WORDS = ['SECURE', 'VERIFIED', 'TRUSTED', 'PROTECTED'];

// Spinning "secure" seal — a circular badge with orbiting trust words that
// rotate continuously around a central shield. A platform-trust motif that
// sits behind the hero text, echoing the trust-badge payoff of the product.
export default function SecureSpinner({ size = 300 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Central shield — static, drawn above the spinning ring */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: size * 0.42,
          height: size * 0.42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #183659, #10243C)',
          color: '#71B77C',
          boxShadow:
            '0 16px 40px -12px rgba(24,54,89,0.55), 0 0 0 6px color-mix(in srgb, var(--mui-palette-success-main) 18%, transparent), 0 0 60px -8px rgba(113,183,124,0.35)',
        }}
      >
        <ShieldIcon sx={{ fontSize: size * 0.22 }} />
      </Box>

      {/* Spinning orbit: ring of small trust marks */}
      <Box
        className="marketing-spin"
        sx={{
          position: 'absolute',
          inset: 0,
          animationDuration: '18s',
        }}
      >
        {SECURE_WORDS.map((word, i) => {
          const angle = (i / SECURE_WORDS.length) * 360;
          return (
            <Box
              key={word}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${size / 2}px)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size * 0.14,
                height: size * 0.14,
                borderRadius: '50%',
                bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper) 55%, transparent)',
                border: '1px solid',
                borderColor: 'color-mix(in srgb, var(--mui-palette-success-main) 30%, transparent)',
                boxShadow: '0 8px 24px -8px rgba(24,54,89,0.35)',
                backdropFilter: 'blur(6px)',
                color: 'success.main',
                fontSize: size * 0.055,
                fontWeight: 800,
                letterSpacing: '0.02em',
              }}
            >
              {word}
            </Box>
          );
        })}
      </Box>

      {/* Outer static ring */}
      <Box
        sx={{
          position: 'absolute',
          inset: size * 0.06,
          borderRadius: '50%',
          border: '1px dashed',
          borderColor: 'color-mix(in srgb, var(--mui-palette-success-main) 35%, transparent)',
        }}
      />

      {/* Soft glow behind everything */}
      <Box
        sx={{
          position: 'absolute',
          inset: '10%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--mui-palette-success-main) 16%, transparent) 0%, transparent 70%)',
        }}
      />
    </Box>
  );
}
