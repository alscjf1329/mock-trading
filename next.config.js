/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@gadicc/fetch-mock-cache/stores/fs.ts': false,
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': false,
    }
    return config
  },
}
module.exports = nextConfig
