'use client';

/** Result of probing a same-origin `/api/download/...` (or marketplace download) endpoint. */
export type ApiDownloadPreflightResult =
  | 'ok'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'error';

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      /* ignore */
    }
  }
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const plain = header.match(/filename=([^;]+)/i);
  return plain?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null;
}

function saveBlobAsDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Check download gate without following redirects (no file body for typical 302 → CDN).
 */
export async function preflightApiDownload(apiPath: string): Promise<ApiDownloadPreflightResult> {
  try {
    const res = await fetch(apiPath, { credentials: 'include', redirect: 'manual' });
    if (res.type === 'opaqueredirect') return 'ok';
    if (res.status === 401) return 'unauthorized';
    if (res.status === 403) return 'forbidden';
    if (res.status === 404) return 'not_found';
    if (res.status >= 500) return 'error';
    if (res.status >= 300 && res.status < 400) return 'ok';
    if (res.ok) return 'ok';
    return 'error';
  } catch {
    return 'error';
  }
}

/** Fallback when blob fetch is unavailable — better than hidden iframe for attachment redirects. */
export function startAnchorDownload(url: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * @deprecated Hidden iframes render PNG/SVG/JPG inline — no save dialog. Prefer blob or anchor.
 */
export function startHiddenIframeDownload(url: string): void {
  startAnchorDownload(url);
}

export async function triggerApiFileDownload(
  apiPath: string,
  opts: {
    onUnauthorized?: () => void;
    onForbidden?: () => void;
    onNotFound?: () => void;
    onError?: () => void;
  } = {},
): Promise<boolean> {
  const pre = await preflightApiDownload(apiPath);
  if (pre === 'unauthorized') {
    opts.onUnauthorized?.();
    return false;
  }
  if (pre === 'forbidden') {
    opts.onForbidden?.();
    return false;
  }
  if (pre === 'not_found') {
    opts.onNotFound?.();
    return false;
  }
  if (pre !== 'ok') {
    opts.onError?.();
    return false;
  }

  const isMobile =
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.assign(apiPath);
    return true;
  }

  try {
    const res = await fetch(apiPath, { credentials: 'include', redirect: 'follow' });
    if (res.status === 401) {
      opts.onUnauthorized?.();
      return false;
    }
    if (res.status === 403) {
      opts.onForbidden?.();
      return false;
    }
    if (res.status === 404) {
      opts.onNotFound?.();
      return false;
    }
    if (!res.ok) {
      opts.onError?.();
      return false;
    }

    const blob = await res.blob();
    if (blob.size > 0) {
      const filename =
        filenameFromContentDisposition(res.headers.get('Content-Disposition')) ?? 'download';
      saveBlobAsDownload(blob, filename);
      return true;
    }
  } catch {
    /* fall through to anchor navigation */
  }

  startAnchorDownload(apiPath);
  return true;
}
