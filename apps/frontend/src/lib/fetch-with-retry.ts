/** Small helper for client fetches that occasionally fail on cold starts or flaky networks. */

export async function fetchJsonWithRetry<T>(
  url: string,
  options?: {
    retries?: number;
    delayMs?: number;
    init?: RequestInit;
  },
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const retries = Math.max(0, options?.retries ?? 2);
  const delayMs = options?.delayMs ?? 400;
  const init: RequestInit = { cache: 'no-store', ...options?.init };

  let lastStatus = 0;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      lastStatus = res.status;
      if (res.ok) {
        const data = (await res.json()) as T;
        return { ok: true, status: res.status, data };
      }
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      return { ok: false, status: res.status, data: null };
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
    }
  }
  return { ok: false, status: lastStatus, data: null };
}
