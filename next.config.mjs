/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    viewTransition: true,
    optimizePackageImports: [
      '@phosphor-icons/react',
      'date-fns',
      'recharts',
    ],
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig