/**
 * Contract for future **private** R2 downloads (presigned GET or worker token).
 *
 * **Do not** implement presigning here without real `R2_*` credentials on a server runtime.
 * Implement in backend (`apps/backend`) or a Next.js Route Handler that uses `@aws-sdk/client-s3`
 * `GetObjectCommand` + `getSignedUrl` against the R2 S3-compatible endpoint.
 */

export type ProSignedUrlOutcome =
  | {
      kind: 'NOT_CONFIGURED';
      /** Explains that signing runs on the server with R2 API credentials. */
      detail: string;
    }
  | {
      kind: 'READY';
      url: string;
      expiresAtEpochMs: number;
 };

export interface ProSignedUrlRequest {
  /** R2 object key in the **private** pro bucket */
  storageKey: string;
  /** Suggested download filename */
  fileName: string;
  /** MIME type for Content-Type / response headers */
  mimeType: string;
}

/**
 * Placeholder: always returns `NOT_CONFIGURED`.
 * Replace the body when you add a server-side signer that reads `R2_*` secrets from env.
 */
export function requestProSignedDownloadUrl(_req: ProSignedUrlRequest): ProSignedUrlOutcome {
  return {
    kind: 'NOT_CONFIGURED',
    detail:
      'Presigned URLs are not generated in the frontend. On the server, use R2 S3-compatible API with R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (see lib/storage/r2-config.ts).',
  };
}
