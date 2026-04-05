/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "*.r2.cloudflarestorage.com" },
      { hostname: "img.clerk.com" },
    ],
  },
  serverExternalPackages: ["passkit-generator", "google-auth-library"],
}

export default nextConfig
