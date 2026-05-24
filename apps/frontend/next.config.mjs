import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo root (`iflag/`). `next` is hoisted here in npm workspaces; Turbopack must resolve it reliably. */
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
  process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
  '';

/** Fallback owner allow-list when env is omitted (comma/newline-separated list allowed). */
const DEFAULT_ADMIN_OWNER = 'nurlanrahmonqulov@gmail.com';

/** Full allow-list string for client bundles (comma/semicolon/newline-separated). */
const publicAdminAllowlist =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST?.trim() ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() ||
  process.env.ADMIN_EMAIL?.trim() ||
  DEFAULT_ADMIN_OWNER;

/** Legacy single-slot env: first email from the allow-list string. */
const publicAdminEmailFirst =
  publicAdminAllowlist.split(/[,;\n]+/).map((s) => s.trim()).find(Boolean) || DEFAULT_ADMIN_OWNER;

/** Storefront downloads: only these Clerk emails bypass paid gates (gallery + marketplace gates). ADMIN_EMAIL alone does not. */
const marketplaceOwnerDownloadPublic =
  process.env.NEXT_PUBLIC_MARKETPLACE_OWNER_DOWNLOAD_EMAILS?.trim() ||
  process.env.MARKETPLACE_OWNER_DOWNLOAD_EMAILS?.trim() ||
  DEFAULT_ADMIN_OWNER;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Monorepo: Turbopack can mis-infer workspace root as `src/app/` and crash with “Next.js package not found”.
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
   */
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  /**
   * Ensure the publishable key is available to both server and client bundles at build time.
   * Maps the common `CLERK_PUBLISHABLE_KEY` typo/alias to what @clerk/nextjs expects.
   */
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
    NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST: publicAdminAllowlist,
    NEXT_PUBLIC_ADMIN_EMAIL: publicAdminEmailFirst,
    NEXT_PUBLIC_MARKETPLACE_OWNER_DOWNLOAD_EMAILS: marketplaceOwnerDownloadPublic,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    /** Allow catalog SVG / vector previews through the image pipeline when optimization is enabled. */
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
