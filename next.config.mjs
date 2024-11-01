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
    ],
  },
};

export default nextConfig;
