/**
 * Hero / header search: open the country folder when the query matches, else filter gallery.
 */
export async function navigateGalleryCountrySearch(query: string): Promise<void> {
  const q = query.trim();
  if (!q) {
    window.location.href = '/gallery';
    return;
  }

  try {
    const res = await fetch(`/api/gallery/resolve-country?q=${encodeURIComponent(q)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { slug?: string | null };
      const slug = data.slug?.trim();
      if (slug) {
        window.location.href = `/gallery/${encodeURIComponent(slug)}`;
        return;
      }
    }
  } catch {
    /* fall through to filtered gallery */
  }

  window.location.href = `/gallery?q=${encodeURIComponent(q)}`;
}
