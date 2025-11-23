/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdfkit for server-side rendering
      config.externals = config.externals || [];
      config.externals.push({
        'pdfkit': 'commonjs pdfkit',
      });
    }
    return config;
  },
}

module.exports = nextConfig

