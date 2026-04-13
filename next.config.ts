import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
];

if (isProduction) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

function getAdditionalImageHosts() {
  const configured = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
  if (!configured) {
    return [];
  }

  return configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
    .filter((value, index, list) => list.indexOf(value) === index);
}

const defaultImageHosts = ["utfs.io", "img.clerk.com", "images.clerk.dev"];
const configuredImageHosts = getAdditionalImageHosts();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "prisma", "ws"],
  images: {
    remotePatterns: [
      ...defaultImageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      ...configuredImageHosts
        .filter((hostname) => hostname !== "localhost")
        .map((hostname) => ({
          protocol: "https" as const,
          hostname,
        })),
      {
        protocol: "https",
        hostname: "**.clerk.accounts.dev",
      },
      {
        protocol: "http" as const,
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
      {
        source: "/sign-in",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
      {
        source: "/sign-up/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sign-up",
        destination: "/sign-in",
        permanent: false,
      },
      {
        source: "/sign-up/:path*",
        destination: "/sign-in",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
