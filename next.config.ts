import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.manuscdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "private-us-east-1.manuscdn.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/cadastro-projeto",
        destination: "/projetos",
        permanent: true,
      },
      {
        source: "/cadastro-voluntario",
        destination: "/voluntarios",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
