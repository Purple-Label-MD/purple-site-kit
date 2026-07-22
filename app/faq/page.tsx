import { Shell } from "@/components/Shell";
import { FaqBattery } from "@/components/patterns";
import { getActiveBrand } from "@/lib/brand";

/** FAQ page — objection-ordered battery, doubling as a safety/education surface. */
export default function FaqPage() {
  const brand = getActiveBrand();
  return (
    <Shell brand={brand}>
      <FaqBattery brand={brand} />
    </Shell>
  );
}
