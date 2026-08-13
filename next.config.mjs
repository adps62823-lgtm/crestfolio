/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
