const webpack = require('webpack')
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /yahoo-finance2[/\\]esm[/\\]tests[/\\]fetchCache/,
        path.resolve(__dirname, 'lib/empty.js')
      )
    )
    return config
  },
}
module.exports = nextConfig
