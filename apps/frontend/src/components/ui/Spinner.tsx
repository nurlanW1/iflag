type SpinnerProps = {
  /** Accessible label; defaults to "Loading" */
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-2',
} as const;

/**
 * Shared loading indicator (replaces duplicate spinners across admin, browse, etc.).
 */
export function Spinner({ label = 'Loading', className = '', size = 'md' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`animate-spin rounded-full border-[#009ab6] border-t-transparent ${sizeClass[size]}`}
      />
    </div>
  );
}
