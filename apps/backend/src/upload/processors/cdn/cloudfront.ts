// AWS CloudFront CDN Cache Purging
// Note: Requires @aws-sdk/client-cloudfront package

export async function purgeCloudFrontCache(urls: string[]): Promise<void> {
  const distribution_id = process.env.CLOUDFRONT_DISTRIBUTION_ID;
  const access_key_id = process.env.AWS_ACCESS_KEY_ID;
  const secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;

  if (!distribution_id || !access_key_id || !secret_access_key) {
    console.warn('CloudFront credentials not configured, skipping CDN purge');
    return;
  }

  try {
    // Dynamic import to avoid requiring AWS SDK if not using CloudFront
    const { CloudFrontClient, CreateInvalidationCommand } = await import('@aws-sdk/client-cloudfront');
    
    const client = new CloudFrontClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: access_key_id,
        secretAccessKey: secret_access_key,
      },
    });

    // Extract paths from URLs
    const paths = urls.map(url => {
      try {
        const url_obj = new URL(url);
        return url_obj.pathname + (url_obj.search || '');
      } catch {
        return url;
      }
    });

    const command = new CreateInvalidationCommand({
      DistributionId: distribution_id,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
        CallerReference: `upload-${Date.now()}`,
      },
    });

    const response = await client.send(command);
    console.log('CloudFront cache invalidation created:', response.Invalidation?.Id);
  } catch (error) {
    console.error('CloudFront purge error:', error);
    // Don't throw - CDN purge failure shouldn't fail the upload
  }
}
