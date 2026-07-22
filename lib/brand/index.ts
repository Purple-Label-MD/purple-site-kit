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
    // INTAKE-SKIN-01 (--pl-*) overrides — only emit keys the brand sets; unset keys
    // fall through to the BRAND-01 defaults in globals.css :root (WI-043).
    ...intakeVars(theme.intake),
  };
}

/** Map optional intake-skin token overrides to their --pl-* custom properties. */
function intakeVars(intake: ThemeTokens["intake"]): Record<string, string> {
  if (!intake) return {};
  const out: Record<string, string> = {};
  if (intake.accent) out["--pl-accent"] = intake.accent;
  if (intake.accentTint) out["--pl-accent-tint"] = intake.accentTint;
  if (intake.canvas) out["--pl-canvas"] = intake.canvas;
  if (intake.surface) out["--pl-surface"] = intake.surface;
  if (intake.ink) out["--pl-ink"] = intake.ink;
  if (intake.inkSoft) out["--pl-ink-soft"] = intake.inkSoft;
  if (intake.cardBorder) out["--pl-card-border"] = intake.cardBorder;
  if (intake.radius) out["--pl-radius"] = intake.radius;
  if (intake.font) out["--pl-font"] = intake.font;
  if (intake.headlineAlign) out["--pl-headline-align"] = intake.headlineAlign;
  return out;
}

export type { BrandConfig };
