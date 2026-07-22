import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { getActiveBrand, themeVars } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Purple SITE-KIT — LAUNCH starter (placeholder)",
  description:
    "Fork-and-own single-condition starter template. Placeholder content — replace before launch.",
  robots: { index: false, follow: false },
};

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
