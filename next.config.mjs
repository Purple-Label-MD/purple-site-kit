/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fork-and-own: nothing platform-specific baked in. Vercel-class deploy works out of the box.
  poweredByHeader: false,
};

export default nextConfig;
