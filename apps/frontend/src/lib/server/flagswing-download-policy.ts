/**
 * Flagswing gallery download policy (app-level). For true isolation of premium bytes,
 * move masters to private Blob + signed URLs — see TODO on `/api/download/[fileId]`.
 */

/** When true (default), `free` tier files require sign-in but not a paid plan. */
export function freeTierRequiresSignIn(): boolean {
  const v = process.env.FLAGSWING_FREE_DOWNLOAD_REQUIRES_SIGNIN?.trim().toLowerCase();
  if (v === 'false' || v === '0') return false;
  return true;
}
