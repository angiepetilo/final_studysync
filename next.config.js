/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zjvuwmasrkwqtvztghwz.supabase.co',
        pathname: '/storage/v1/object/**',
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons'
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        '@capacitor/core',
        '@capacitor/preferences',
        '@capacitor/camera',
        '@capacitor/haptics',
        '@capacitor/push-notifications',
        '@capacitor/android',
        '@capacitor/ios',
      ]
    }
    return config
  }
}

module.exports = nextConfig
