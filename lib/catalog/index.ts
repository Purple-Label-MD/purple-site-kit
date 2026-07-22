/**
 * Typed catalog surface for the app. Projection LOGIC lives in projection.mjs
 * (CI-testable pure module, typed by projection.d.mts); DATA lives in demo.ts.
 */
export type {
  Audience,
  AudienceId,
  Catalog,
  LabKind,
  LabPanel,
  LabTier,
  Offering,
  PageMeta,
  SupplyTerm,
} from "@/lib/catalog/types";
export { AUD_A, AUD_B, demoAudiences, demoCatalog } from "@/lib/catalog/demo";
export {
  categoriesForAudience,
  featuredForAudience,
  findOffering,
  findPanel,
  isExclusive,
  labPanelsForAudience,
  offeringsForAudience,
  panelsByKind,
} from "@/lib/catalog/projection.mjs";
