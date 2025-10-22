/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
}

module.exports = nextConfig
