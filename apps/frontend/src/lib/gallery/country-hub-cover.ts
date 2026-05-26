/** True when a public URL points at a WebP object (hub folder cover). */
export function urlLooksLikeWebpAsset(url: string | null | undefined): boolean {
  const u = (url ?? '').trim();
  if (!u) return false;
  return /\.webp(?:$|[?#])/i.test(u) || u.includes('image/webp');
}
