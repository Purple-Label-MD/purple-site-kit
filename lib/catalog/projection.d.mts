import type { AudienceId, Catalog, LabKind, LabPanel, Offering } from "./types";

export function offeringsForAudience(catalog: Catalog, audienceId: AudienceId): Offering[];
export function labPanelsForAudience(catalog: Catalog, audienceId: AudienceId): LabPanel[];
export function featuredForAudience(catalog: Catalog, audienceId: AudienceId): Offering[];
export function categoriesForAudience(catalog: Catalog, audienceId: AudienceId): string[];
export function isExclusive(offering: Offering): boolean;
export function findOffering(
  catalog: Catalog,
  audienceId: AudienceId,
  slug: string,
): Offering | null;
export function findPanel(catalog: Catalog, slug: string): LabPanel | null;
export function panelsByKind(catalog: Catalog, audienceId: AudienceId, kind: LabKind): LabPanel[];
