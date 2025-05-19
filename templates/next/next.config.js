/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Example of image domains configuration
  images: {
    domains: ['example.com'],
  },
  
  // Enable experimental features
  experimental: {
    // appDir: true, // Uncomment to enable app directory
  },
  
  // Environment variables
  env: {
    // Custom environment variables
    // EXAMPLE_VARIABLE: process.env.EXAMPLE_VARIABLE,
  },
  
  // Redirects
  async redirects() {
    return [
      // Example redirect
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },
  
  // Headers
  async headers() {
    return [
      // Example security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;