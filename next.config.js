const nextConfig = {
  output: 'standalone',
  images: {
    // Removed unoptimized: true
    // Using Next.js optimization now
    domains: ['urntwznaqnaxofylqnfa.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          
          // Control embedding
          { key: "Content-Security-Policy", value: "frame-ancestors 'self';" },
          
          // CORS - only allow your domain
          { key: "Access-Control-Allow-Origin", value: allowedOrigins },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          
          // XSS protection
          { key: "X-XSS-Protection", value: "1; mode=block" },
          
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;