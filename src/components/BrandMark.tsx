type Size = 'sm' | 'md' | 'lg' | 'hero';

const sizes: Record<Size, number> = {
  sm: 36,
  md: 48,
  lg: 72,
  hero: 128,
};

export function BrandMark({
  size = 'md',
  className = '',
}: {
  size?: Size;
  className?: string;
}) {
  const px = sizes[size];
  return (
    <img
      src="/logo.png"
      alt="Goi Cleaning Services"
      width={px}
      height={px}
      className={`brand-mark brand-mark-${size}${className ? ` ${className}` : ''}`}
      decoding="async"
    />
  );
}
