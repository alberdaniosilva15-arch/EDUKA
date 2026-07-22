/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Security headers configuration — CSP separada dev/produção
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: produção sem unsafe-eval — dev precisa para React hot reload
      isDev
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com"
        : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      // Styles: self + inline (styled-jsx) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: self + data URIs + https + blob (Spline textures)
      "img-src 'self' data: https: blob:",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connect: self + AI APIs + Supabase + Spline runtime
      "connect-src 'self' https://generativelanguage.googleapis.com https://api.groq.com https://*.supabase.co wss://*.supabase.co https://my.spline.design https://prod.spline.design",
      // Frame/Spline: Spline scene viewer
      "frame-src https://my.spline.design https://prod.spline.design https://viewer.spline.design",
      // Worker: pdf.js web worker (ficheiro local bundled)
      "worker-src 'self' blob:",
      // Media: local video + Cloudinary
      "media-src 'self' blob: https://res.cloudinary.com",
      // Objects: none
      "object-src 'none'",
      // Frame ancestors: none (anti-clickjacking)
      "frame-ancestors 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form action: self only
      "form-action 'self'",
      // Upgrade insecure requests in production only
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig = {
  // Prevent false "multiple lockfiles" warnings
  outputFileTracingRoot: process.cwd(),

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },

  // NOTA: Redirect HTTP→HTTPS removido intencionalmente.
  // Vercel força HTTPS automaticamente + HSTS + upgrade-insecure-requests na CSP.
  // O redirect manual causava risco de loop atrás de proxy (x-forwarded-proto).

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        https: false,
        http: false,
        stream: false,
        path: false,
      };
      
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
    }
    return config;
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // ESLint 9 flat config is validated with `npm run lint`; avoid Next build's
  // legacy serialization path from failing on parser functions.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compression
  compress: true,

  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
    OPENCODE_API_KEY: process.env.OPENCODE_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

export default nextConfig;
