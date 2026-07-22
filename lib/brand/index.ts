import { aurora } from "@/lib/brand/aurora";
import { growth } from "@/lib/brand/growth";
import { peer } from "@/lib/brand/peer";
import type { BrandConfig, ThemeTokens } from "@/lib/brand/types";
import { brandId } from "@/lib/config";

/** Registry of demo brands. A fork adds its own brand here (or replaces these). */
export const BRANDS: Record<string, BrandConfig> = {
  [aurora.brandId]: aurora,
  [peer.brandId]: peer,
  [growth.brandId]: growth,
};

/** Resolve a brand by id, falling back to Aurora if the id is unknown. */
export function getBrand(id?: string): BrandConfig {
  if (id && BRANDS[id]) return BRANDS[id];
  return aurora;
}

/** The active brand, selected by NEXT_PUBLIC_PURPLE_BRAND_ID (theming proof knob). */
export function getActiveBrand(): BrandConfig {
  return getBrand(brandId());
}

/** Map theme tokens to CSS custom properties for a scoped style attribute. */
export function themeVars(theme: ThemeTokens): Record<string, string> {
  return {
    "--c-bg": theme.colorBg,
    "--c-surface": theme.colorSurface,
    "--c-text": theme.colorText,
    "--c-muted": theme.colorMuted,
    "--c-primary": theme.colorPrimary,
    "--c-primary-contrast": theme.colorPrimaryContrast,
    "--c-accent": theme.colorAccent,
    "--c-border": theme.colorBorder,
    "--font-sans": theme.fontSans,
    "--radius": theme.radius,
    "--max-width": theme.maxWidth,
  };
}

export type { BrandConfig };
