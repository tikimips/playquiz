import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ebewoojmfbyewqwfkbsd.supabase.co',
      },
    ],
  },
}

export default nextConfig
