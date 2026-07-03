interface BrandMarkProps {
  size?: number;
}

export default function BrandMark({ size = 24 }: BrandMarkProps) {
  return (
    <svg width={size} height={(size * 28) / 24} viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 28L1.5 23.5V6L12 1.5L22.5 6V23.5L12 28Z" fill="var(--mui-palette-primary-main)" />
      <path d="M7 14L10.5 17.5L17 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
