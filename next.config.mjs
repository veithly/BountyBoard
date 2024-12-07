/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.img2ipfs.com",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "s2.loli.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // 忽略 eslint 检查
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TypeScript 检查
  }
};

export default nextConfig;
