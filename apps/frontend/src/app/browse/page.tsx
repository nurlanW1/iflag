import { permanentRedirect } from 'next/navigation';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy `/browse` — catalog search lives on `/gallery`. */
export default async function BrowseLegacyRedirect({ searchParams }: Props) {
  const sp = await searchParams;
  const parts: string[] = [];
  for (const [key, val] of Object.entries(sp)) {
    if (val == null) continue;
    const v = Array.isArray(val) ? val[0] : val;
    if (v) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  permanentRedirect(parts.length ? `/gallery?${parts.join('&')}` : '/gallery');
}
