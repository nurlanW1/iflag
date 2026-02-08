// Cloudflare CDN Cache Purging

export async function purgeCloudflareCache(urls: string[]): Promise<void> {
  const api_token = process.env.CLOUDFLARE_API_TOKEN;
  const zone_id = process.env.CLOUDFLARE_ZONE_ID;

  if (!api_token || !zone_id) {
    console.warn('Cloudflare credentials not configured, skipping CDN purge');
    return;
  }

  try {
    // Purge by URLs
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone_id}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: urls,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare purge failed: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log('Cloudflare cache purged:', result);
  } catch (error) {
    console.error('Cloudflare purge error:', error);
    // Don't throw - CDN purge failure shouldn't fail the upload
  }
}
