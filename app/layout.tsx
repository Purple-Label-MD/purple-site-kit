import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { getActiveBrand, themeVars } from "@/lib/brand";

function rootMetadata(): Metadata {
  const brand = getActiveBrand();
  return {
    title: brand.contentReviewed ? brand.name : "Purple SITE-KIT — LAUNCH starter (placeholder)",
    description: brand.contentReviewed
      ? brand.tagline
      : "Fork-and-own single-condition starter template. Placeholder content — replace before launch.",
    // Dev-environment deploy stays noindex; flip alongside the production launch.
    robots: { index: false, follow: false },
  };
}

export const metadata: Metadata = rootMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = getActiveBrand();
  // Per-brand theme tokens as CSS custom properties — the whole-site reskin knob.
  const style = themeVars(brand.theme) as CSSProperties;
  return (
    <html lang="en">
      <body style={style}>{children}</body>
    </html>
  );
}
