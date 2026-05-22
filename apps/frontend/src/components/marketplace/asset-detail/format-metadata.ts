import type { LucideIcon } from 'lucide-react';
import { FileCode2, ImageIcon, Layers, Palette, Sheet } from 'lucide-react';

export type FormatPitch = {
  headline: string;
  bestFor: string;
};

const DEFAULT_PITCH: FormatPitch = {
  headline: 'Production export',
  bestFor: 'Use in decks, renders, or print proofs — pick the fidelity you need.',
};

const PITCH: Record<string, FormatPitch> = {
  svg: {
    headline: 'Scalable vector',
    bestFor: 'Infinitely scalable — ideal for signage, embroidery, SVG web, or large-format print.',
  },
  eps: {
    headline: 'Editable vector legacy',
    bestFor: 'Professional print workflows — open in Illustrator, Inkscape-compatible pipelines.',
  },
  ai: {
    headline: 'Adobe Illustrator source',
    bestFor: 'Native vector edits in Creative Cloud or compatible tools.',
  },
  pdf: {
    headline: 'Vector / print PDF',
    bestFor: 'Archival handoff, proofs, prepress pipelines, mixed vector + raster bundles.',
  },
  png: {
    headline: 'Raster with transparency',
    bestFor: 'Web comps, thumbnails, overlays, and apps that need crisp alpha edges.',
  },
  webp: {
    headline: 'Efficient raster',
    bestFor: 'Modern browsers — lighter weight previews while staying sharp.',
  },
  jpg: {
    headline: 'High-quality JPEG',
    bestFor: 'Social, blogs, thumbnails, CMS embeds — small size, broad compatibility.',
  },
  jpeg: {
    headline: 'High-quality JPEG',
    bestFor: 'Social, blogs, thumbnails, CMS embeds — small size, broad compatibility.',
  },
};

export function pitchForExtension(extRaw: string): FormatPitch {
  const k = extRaw.trim().replace(/^\./, '').toLowerCase();
  return PITCH[k] ?? DEFAULT_PITCH;
}

export function formatBadgeLabel(extRaw: string): string {
  return extRaw.trim().replace(/^\./, '').toUpperCase();
}

const ICON_HINT: Record<string, LucideIcon> = {
  svg: Layers,
  eps: Palette,
  ai: Palette,
  pdf: Sheet,
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
  webp: ImageIcon,
};

export function formatIconFor(extRaw: string): LucideIcon {
  const k = extRaw.trim().replace(/^\./, '').toLowerCase();
  return ICON_HINT[k] ?? FileCode2;
}

/** Human-readable MIME family for PDP metadata line — keep short. */
export function shortMimeFamily(mime: string | undefined | null): string | null {
  const m = (mime ?? '').trim().toLowerCase();
  if (!m || m === 'application/octet-stream') return null;
  if (m.includes('svg')) return 'SVG';
  if (m.includes('jpeg') || m.includes('jpg')) return 'JPEG';
  if (m.includes('png')) return 'PNG';
  if (m.includes('webp')) return 'WebP';
  if (m.includes('pdf')) return 'PDF';
  if (m.includes('postscript') || m.includes('eps')) return 'EPS';
  if (m.includes('illustrator') || m.includes('ai')) return 'AI';
  return null;
}

export function bytesToHuman(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb >= 100 ? kb.toFixed(0) : kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb >= 100 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb >= 100 ? gb.toFixed(1) : gb.toFixed(2)} GB`;
}
