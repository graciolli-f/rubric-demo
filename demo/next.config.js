 /** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@rubric/validate'],
    webpack: (config) => {
      // Handle .rux files as raw text
      config.module.rules.push({
        test: /\.rux$/,
        type: 'asset/source',
      });
      
      return config;
    },
  }