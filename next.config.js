/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'yahoo-finance2']
    }
    return config
  },
}
module.exports = nextConfig
