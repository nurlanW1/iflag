import { hasFlag } from 'country-flag-icons';

type Props = {
  code: string | null;
  className?: string;
};

/**
 * Renders a flag using [lipis/flag-icons](https://github.com/lipis/flag-icons) (CSS + local SVGs).
 * Requires `import 'flag-icons/css/flag-icons.min.css'` in the root layout.
 */
export default function FlagCssIcon({ code, className }: Props) {
  if (!code || !hasFlag(code)) {
    return null;
  }
  const iso = code.toLowerCase();
  return (
    <span
      role="img"
      aria-label={`${code} flag`}
      className={`fib fi fi-${iso}${className ? ` ${className}` : ''}`}
    />
  );
}
