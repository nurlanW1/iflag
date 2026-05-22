'use client';

/** Result of probing a same-origin `/api/download/...` (or marketplace download) endpoint. */
export type ApiDownloadPreflightResult =
  | 'ok'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'error';

/**
 * Check download gate without following redirects (no file body for typical 302 → CDN).
 */
export async function preflightApiDownload(apiPath: string): Promise<ApiDownloadPreflightResult> {
  try {
    const res = await fetch(apiPath, { credentials: 'include', redirect: 'manual' });
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

/**
 * Load URL in a hidden iframe so the **visible** tab stays on the gallery / product page.
 * Works for same-origin API paths and absolute CDN URLs.
 */
export function startHiddenIframeDownload(url: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  iframe.title = 'Download';
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;visibility:hidden';
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    try {
      iframe.remove();
    } catch {
      /* ignore */
    }
  }, 300_000);
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
  startHiddenIframeDownload(apiPath);
  return true;
}
