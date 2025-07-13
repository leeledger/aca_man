/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID || 'placeholder-for-build',
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
  webpack: (config) => {
    // Ensure CSS modules are properly processed
    const rules = config.module.rules
      .find((rule) => typeof rule.oneOf === 'object')
      .oneOf.filter((rule) => Array.isArray(rule.use));

    rules.forEach((rule) => {
      rule.use.forEach((moduleLoader) => {
        if (moduleLoader.loader?.includes('css-loader') && !moduleLoader.loader?.includes('postcss-loader')) {
          moduleLoader.options.importLoaders = 1;
        }
      });
    });
    
    return config;
  },
  // 정규식 스택 오버플로우 문제 해결을 위한 설정 추가
  experimental: {
    turbotrace: {
      memoryLimit: 4096, // 메모리 제한 증가
    },
  },
}

module.exports = nextConfig