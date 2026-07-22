/** Site chrome: nav (with the campaign nav-strip toggle) and footer. */

import { SealSlot } from "@/components/ui";
import type { BrandConfig } from "@/lib/brand/types";
import { entryLink } from "@/lib/purple/entry-links";

/**
 * Site nav. On campaign landers the nav strip is a deliberate template TOGGLE
 * (teardown §2/§8): when `stripped`, only the wordmark + primary CTA remain, so
 * paid traffic has one road. Driven by brand.navStripOnCampaign per brand.
 */
export function SiteNav({ brand, stripped = false }: { brand: BrandConfig; stripped?: boolean }) {
  return (
    <nav className="site-nav container" aria-label="Primary">
      <a className="wordmark" href="/">
        {brand.logo.wordmark}
      </a>
      {stripped ? (
        <a className="btn" href={entryLink()}>
          {brand.copy.cta_primary}
        </a>
      ) : (
        <div className="links">
          <a href={`/condition/${brand.condition.slug}`}>Program</a>
          <a href="/about">About</a>
          <a href="/faq">FAQ</a>
          <a href="/contact">Contact</a>
          <a href="/members">{brand.copy.member_entry}</a>
          <a className="btn" href={entryLink()}>
            {brand.copy.cta_primary}
          </a>
        </div>
      )}
    </nav>
  );
}

/** Footer with the layered disclaimer stack + seal SLOT (placement only). */
export function SiteFooter({ brand }: { brand: BrandConfig }) {
  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 240px" }}>
            <div className="wordmark">{brand.logo.wordmark}</div>
            <p className="muted" style={{ fontSize: 13 }}>
              {brand.tagline}
            </p>
            <nav aria-label="Legal" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/legal/terms">Terms</a>
              <a href="/legal/privacy">Privacy</a>
              <a href="/legal/consent">Consent</a>
              <a href="/legal/returns">Returns</a>
              <a href="/legal/provider-disclosure">Provider disclosure</a>
            </nav>
          </div>
          <div>
            <SealSlot note={brand.copy.seal_slot_note} />
          </div>
        </div>
        <div className="disclaimer-stack" style={{ marginTop: 20 }}>
          <p>
            PLACEHOLDER DISCLAIMER STACK — replace with counsel-reviewed text. These lines are
            scaffolding, not legal or medical statements.
          </p>
          <p>
            [FDA / product-status disclosure slot.] [Clinician-required / not-a-substitute-for-care
            slot.] [Privacy / data-handling slot.]
          </p>
          <p>Individual results vary and are not guaranteed.</p>
        </div>
      </div>
    </footer>
  );
}
