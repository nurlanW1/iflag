import type { User } from '@clerk/nextjs/server';
import {
  type FlagFilePurchaseRow,
  userOwnsPaidFlagFile,
} from '@/lib/server/flag-file-purchase-access';

/**
 * @deprecated Use `userOwnsPaidFlagFile` per design — subscriptions no longer grant downloads.
 */
export async function userHasFlagswingPaidDownloadAccess(
  _pool: unknown,
  clerkUser: User | null | undefined,
  backendAccessToken: string | null | undefined,
  fileRow?: FlagFilePurchaseRow,
): Promise<boolean> {
  if (!fileRow) return false;
  return userOwnsPaidFlagFile(clerkUser, backendAccessToken, fileRow);
}
