/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    // Suppress webpack cache serialization warning (harmless; large strings in pack cache)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { message: /Serializing big strings.*deserialization performance/ },
    ];
    return config;
  },
};

export default nextConfig;
