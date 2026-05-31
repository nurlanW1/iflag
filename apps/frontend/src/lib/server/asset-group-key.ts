/** Stable purchase group key for a Neon `country_flag_files` row (aligned with backend). */

export function soloAssetGroupKey(fileId: string): string {
  return `solo:${fileId.trim().toLowerCase()}`;
}

export function assetGroupKeyForFlagFileRow(row: {
  id: string;
  asset_group_key: string | null;
}): string {
  const ag = row.asset_group_key?.trim();
  if (ag) return ag.toLowerCase();
  return soloAssetGroupKey(row.id);
}
