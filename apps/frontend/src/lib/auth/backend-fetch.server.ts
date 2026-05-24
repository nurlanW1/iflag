import { NextResponse } from 'next/server';
import {
  formatBackendUnreachableError,
  joinBackendApiPath,
  probeBackendConnectivity,
  type BackendProbeResult,
} from '@/lib/auth/backend-url';

export const BACKEND_FETCH_TIMEOUT_MS = 15_000;

export class BackendFetchError extends Error {
  readonly attemptedUrl: string;
  readonly baseUrl: string;
  readonly path: string;
  readonly probes?: BackendProbeResult[];

  constructor(
    baseUrl: string,
    path: string,
    cause: unknown,
    probes?: BackendProbeResult[],
  ) {
    const attemptedUrl = joinBackendApiPath(baseUrl, path);
    super(formatBackendUnreachableError({ baseUrl, attemptedUrl, cause, probes }));
    this.name = 'BackendFetchError';
    this.baseUrl = baseUrl;
    this.path = path;
    this.attemptedUrl = attemptedUrl;
    this.probes = probes;
  }
}

/** Server-side fetch to the Railway backend (normalized …/api base + route path). */
export async function fetchBackendApi(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = joinBackendApiPath(baseUrl, path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (cause) {
    let probes: BackendProbeResult[] | undefined;
    try {
      probes = await probeBackendConnectivity(baseUrl);
    } catch {
      /* ignore probe failures */
    }
    throw new BackendFetchError(baseUrl, path, cause, probes);
  } finally {
    clearTimeout(timer);
  }
}

export async function backendUnreachableResponse(
  baseUrl: string,
  path: string,
  cause: unknown,
  status = 502,
): Promise<NextResponse> {
  if (cause instanceof BackendFetchError) {
    return NextResponse.json(
      { error: cause.message, code: 'API_UNREACHABLE', probes: cause.probes },
      { status },
    );
  }

  let probes: BackendProbeResult[] | undefined;
  try {
    probes = await probeBackendConnectivity(baseUrl);
  } catch {
    /* ignore */
  }

  const attemptedUrl = joinBackendApiPath(baseUrl, path);
  return NextResponse.json(
    {
      error: formatBackendUnreachableError({ baseUrl, attemptedUrl, cause, probes }),
      code: 'API_UNREACHABLE',
      probes,
    },
    { status },
  );
}
