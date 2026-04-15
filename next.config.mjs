/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    const resumeAppUrl = process.env.RESUME_APP_URL

    if (!resumeAppUrl) {
      return []
    }

    const destination = resumeAppUrl.replace(/\/$/, '')

    return [
      {
        source: '/resume/:path*',
        destination: `${destination}/:path*`,
      },
    ]
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