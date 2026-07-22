import { Shell } from "@/components/Shell";
import { FaqBattery } from "@/components/patterns";
import { getActiveBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions — an objection-ordered battery doubling as a safety and education surface. Placeholder answers; replace before launch.",
});

/** FAQ page — objection-ordered battery, doubling as a safety/education surface. */
export default function FaqPage() {
  const brand = getActiveBrand();
  return (
    <Shell brand={brand}>
      <FaqBattery brand={brand} />
    </Shell>
  );
}
