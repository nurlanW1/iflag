import type { User } from '@clerk/nextjs/server';
import { fetchBackendAssetOwnership } from '@/lib/account/billing-ownership.server';
import { isMarketplaceOwnerDownloadBypass } from '@/lib/account/entitlements.server';
import { normalizedEmailsFromClerkUser } from '@/lib/auth/admin-email';
import { slugFromAssetGroupKey } from '@/lib/marketplace/group-flag-products';
import { assetGroupKeyForFlagFileRow } from '@/lib/server/asset-group-key';

export type FlagFilePurchaseRow = {
  id: string;
  asset_group_key: string | null;
};

export function marketplaceSlugForFlagFile(row: FlagFilePurchaseRow): string {
  const ag = row.asset_group_key?.trim();
  if (ag) return slugFromAssetGroupKey(ag);
  return `nf-${row.id.toLowerCase()}`;
}

/** Paid Neon row: owner bypass or lifetime one-time purchase for this design group. */
export async function userOwnsPaidFlagFile(
  clerkUser: User | null | undefined,
  accessToken: string | null | undefined,
  row: FlagFilePurchaseRow,
): Promise<boolean> {
  if (!clerkUser?.id) return false;

  const emails = normalizedEmailsFromClerkUser(clerkUser);
  if (emails.some((e) => isMarketplaceOwnerDownloadBypass(e))) return true;

  const tok = accessToken?.trim();
  if (!tok) return false;

  const productSlug = marketplaceSlugForFlagFile(row);
  const assetGroupKey = assetGroupKeyForFlagFileRow(row);

  const ownership = await fetchBackendAssetOwnership(tok, {
    productSlug,
    assetGroupKey,
  });
  if (ownership?.ownsProduct) return true;

  return false;
}
