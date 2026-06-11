/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
