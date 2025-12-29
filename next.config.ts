import type { NextConfig } from "next";

// Use basePath for GitHub Pages deployment, but not for Vercel
// GitHub Pages deploys to /haven subpath, Vercel deploys to root
const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';
const basePath = isGitHubPages ? '/haven' : '';

const nextConfig: NextConfig = {
  output: 'export',
  ...(isGitHubPages && { basePath }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default nextConfig;
