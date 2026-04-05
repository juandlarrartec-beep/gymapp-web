/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "*.r2.cloudflarestorage.com" },
      { hostname: "img.clerk.com" },
    ],
  },
  outputFileTracingExcludes: {
    "*": ["./export-detail.json"],
  },
}

export default nextConfig
