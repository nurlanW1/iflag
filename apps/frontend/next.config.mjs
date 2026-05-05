/** @type {import('next').NextConfig} */
const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
  process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
  '';

const nextConfig = {
  reactStrictMode: true,
  /**
   * Ensure the publishable key is available to both server and client bundles at build time.
   * Maps the common `CLERK_PUBLISHABLE_KEY` typo/alias to what @clerk/nextjs expects.
   */
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86_400,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      /** Cloudflare Images / CDN */
      { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
      /** Typical public R2 dev host — add your custom domain as another entry if needed */
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
      /**
       * Broad pattern for operator CDNs (e.g. custom R2 domain).
       * Tighten to your hostname in production if you do not need wildcards.
       */
      { protocol: 'https', hostname: '**', pathname: '/**' },
    ],
  },
};

export default nextConfig;
