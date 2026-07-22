import { SiteFooter, SiteNav } from "@/components/chrome";
import type { BrandConfig } from "@/lib/brand/types";

/** Standard page shell: nav + content + footer. `stripped` toggles the campaign nav strip. */
export function Shell({
  brand,
  stripped = false,
  children,
}: {
  brand: BrandConfig;
  stripped?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav brand={brand} stripped={stripped} />
      <main>{children}</main>
      <SiteFooter brand={brand} />
    </>
  );
}
