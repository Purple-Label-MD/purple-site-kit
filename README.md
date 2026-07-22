# purple-site-kit — LAUNCH template

A **fork-and-own** single-condition starter site for launching a Purple-powered
DTC telehealth funnel fast. Next.js / Vercel-class, ~12 pages, wired to the Purple
public API. This is **distributable product**, not platform code — you fork it, make
it yours, and deploy it.

> **Why this exists.** Certification (LegitScript-class) reviews a **live site**, and
> payment due-diligence follows certification — so standing the site up is the long
> pole of onboarding. This template compresses that to days. Checkout ships **stubbed**
> and wakes when the commerce family lands; nothing here blocks on it.

Everything shipped here is **placeholder scaffolding**: no real medication content or
imagery, no real pricing, no real clinician/patient data, no credentials. Replace it
all before you launch.

---

## Quick start (credential-free)

```bash
npm install
npm run dev          # http://localhost:3000
```

With no configuration, the site runs against a **built-in synthetic mock** of the
Purple API, so a fresh clone is fully runnable and demonstrable — intake flow,
webhooks, journey status and all — **without any credentials**.

```bash
npm run verify       # lint + copy-guard self-test + copy-guard + build + link-check
```

## Going live

Copy `.env.example` to `.env.local` and fill it in (never commit it):

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_PURPLE_API_BASE` | The projected public gateway base **including `/v1`**. Setting it turns off mock mode. |
| `NEXT_PUBLIC_PURPLE_BRAND_ID` | Your brand id (`brd_…`) — selects the brand config and rides as `X-Brand-Id`. |
| `NEXT_PUBLIC_PURPLE_OFFERING_REF` | A stable offering ref preselected on entry links. |
| `PURPLE_API_KEY` | Server-only per-client M2M key (`Authorization: Bearer …`). Never exposed to the browser. |
| `PURPLE_WEBHOOK_SECRET` | Server-only HMAC secret for verifying inbound webhook signatures. |

**Zero hardcoded endpoints.** Every Purple call resolves its base URL from
`lib/config.ts`, which reads it from the environment. The copy-guard fails the build
if an absolute API URL literal ever appears in code. The browser never calls the
gateway directly — it calls this app's same-origin BFF routes (`/api/purple/*`),
which attach the key server-side.

> A test credential is not required to build or run. When your dev client is
> provisioned, set the base URL + key and the same code path goes live. The synthetic
> acceptance walkthrough (entry link → full intake → checkout stub → webhook events)
> runs against the live gateway at that point.

## The fork-and-own contract

1. **Fork a released tag, not `main`-tip.** Releases are versioned; `main` moves.
   Pin to a tag so upgrades are deliberate (`git checkout v0.1.0`).
2. **Set your brand.** Brand is chosen at **build/deploy time** via
   `NEXT_PUBLIC_PURPLE_BRAND_ID`. Add your brand config under `lib/brand/` (copy
   `aurora.ts`), or edit the tokens there — logo/palette/type, copy slots,
   merchandising, pattern content, and an optional vertical overlay.
3. **Replace every placeholder.** All copy is hedged, visibly-marked scaffolding.
   The copy-guard blocks unmarked filler, but you must still swap the marked slots
   for real, reviewed content.
4. **Get legal reviewed.** Every `/legal/*` page and the footer disclaimer stack ship
   as `REQUIRES COUNSEL REVIEW` placeholders. See
   [`docs/certification-readiness.md`](docs/certification-readiness.md). The reviewed
   legal pack is a separate, counsel-gated deliverable — **not** in this template.
5. **Fill clinician bios with real, verifiable providers.** Named clinician identity
   is a first-class slot here (most competitors ship faceless) — use it.
6. **Deploy** to Vercel (or any Next.js host). Set the env vars in your host.

## What's in the box

- **~12 page types** — home (pre-lander *or* long-scroll, per brand), condition page,
  nested campaign lander (`/condition/{c}/{campaign}` with a nav-strip toggle), About,
  FAQ, Contact, legal slots, member entry, intake host, checkout stub, status page,
  webhooks console.
- **Purple wiring** — entry-link composer, a **headless intake renderer** (the drop-in
  component: server-authoritative resolve→next loop, one node per screen, exclusive
  options, prefill-always-confirmed, address typeahead, file-capture upload refs,
  abandon), auth-trio pages, a **webhook receiver with HMAC verification**, a
  journey-status read, and a clearly-marked **checkout stub**.
- **Pattern components** — 3-step ritual, trust triad, seal *slot* (placement only —
  never a shipped seal), two-SKU ladder + commitment grid, objection-ordered FAQ,
  testimonials with a built-in results-vary disclaimer, clinician-bio slots.
- **Theming layer** — brands are pure config/tokens. Two demo brands (`aurora`
  generic, `peer` vertical overlay) prove a full reskin from config alone.

## Two archetypes, three demo brands

The kit ships **two archetypes** — **LAUNCH** (single-condition starter) and **GROWTH**
(multi-audience storefront) — proven by **three demo brands**, all pure config/tokens:

```bash
NEXT_PUBLIC_PURPLE_BRAND_ID=brd_demo_aurora npm run build && npm start   # LAUNCH · purple, long-scroll
NEXT_PUBLIC_PURPLE_BRAND_ID=brd_demo_peer   npm run build && npm start   # LAUNCH · terracotta, pre-lander,
                                                                         #          + vertical overlay
NEXT_PUBLIC_PURPLE_BRAND_ID=brd_demo_growth npm run build && npm start   # GROWTH · teal storefront,
                                                                         #          two audiences + labs
```

Same code, different data → fully-themed sites. The theming *mechanism* (tokens → CSS
vars) is identical across all three; only the brand config changes.

## GROWTH archetype (WI-042)

GROWTH is the multi-line storefront an operator grows into. It **extends** LAUNCH (same
chassis, tokens, copy-guard, cert-readiness checklist, clinician-bio slots, entry-link
composer, intake renderer, auth trio, webhook receiver, journey-status read) and adds
four capability deltas, all driven by **one catalog config** (`lib/catalog/`):

1. **Audience as a catalog dimension.** One catalog projected through audience *lenses*.
   A shared line renders in **both** lenses; an audience-exclusive line in **exactly one**.
   Never two catalogs, never a cloned SKU — audience is set-membership on the offering
   (`offering.audiences: AudienceId[]`). The projection is pure and unit-tested
   (`npm run catalog:test`).
2. **Entry-mode toggle** (`quiz-first | buy-first`) per brand, with a per-campaign
   `?mode=` override. **Buy-first requires** the eligibility-honesty block beside every
   buy control ("a licensed clinician reviews every order; not qualified = automatic full
   refund") and routes the checkout **stub** → the intake renderer.
3. **Supply-term selector** — a default-expanded, config-driven term ladder
   (`offering.supplyTerms`); the merchandising surface, not a post-click reveal.
4. **Labs product line** — marketing-complete, **fulfillment-stubbed**: gendered panel
   ladders (basic/intermediate/advanced × audience), panel PDP grammar
   (name → what's tested → why → sample → turnaround), individual-vs-package split, a
   what-we-test transparency page, a how-it-works ritual, and therapy-adjacent panels
   cross-linked as qualification on-ramps. Every labs CTA is gated like the checkout stub
   until the labs lane (vendor + BAA) ships.

### GROWTH config schema

A GROWTH brand sets `archetype: "growth"` and a `growth` block. The catalog shape
(`lib/catalog/types.ts`) — a fork swaps the data, never the shape:

```ts
brand.growth = {
  audiences: Audience[];   // root lenses: { id, slug, label, hero*, negativeExperience,
                           //   peerMirrorCasting, audienceMedicalContent[], imagerySlot }
  catalog: {
    offerings: Offering[]; // { slug, name, category, audiences: AudienceId[], featured?,
                           //   roleLabel, placeholderMolecule, summary, whatItIs,
                           //   howItWorks[], supplyTerms: SupplyTerm[], faq[], labsAdjacent? }
    labPanels: LabPanel[]; // { slug, name, audiences[], tier, kind, whatsTested[], why,
                           //   sampleType, turnaround, therapyOnRamp? }
  };
  funnelMode: "quiz-first" | "buy-first";   // default; a campaign overrides via ?mode=
};
```

Routes: `/{audience}` (storefront), `/{audience}/{offering}` (condition unit),
`/labs`, `/labs/{panel}`, `/labs/{individual,packages,what-we-test,how-it-works}`.
Audience segments are SSG (`generateStaticParams` + `dynamicParams = false`).

## CI — this repo's whole gate (governance-lite)

No six-gate platform apparatus here (no PHI, no money, no platform code). The law is:

- **build + lint** (`biome`)
- **fail-closed copy-guard** — greps the teardown NEVER list (no outcome guarantees,
  no scarcity/urgency theater, no superlative efficacy claims, no unmarked filler) +
  a hardcoded-endpoint check. Proven **RED-first**: `scripts/copy-guard.test.mjs`
  asserts every rule fires on a planted violation *and* the tree is clean, on every run.
- **catalog projection self-test** (`scripts/catalog.test.mjs`) — proves the anti-clone
  law in miniature: shared line → both audience lenses, exclusive → exactly one.
- **fail-closed per-page-meta check** — boots the built app and fails closed on any
  missing / default / duplicate title, description, or OG (the addendum §4① failure:
  every URL serving identical meta). Proven **RED-first**: `scripts/meta-check.test.mjs`
  plants each failure mode. The CI build uses the GROWTH demo brand so the crawl covers
  the storefront + labs (the superset of routes).
- **link check** — boots the built app and crawls internal links.

PRs are **bot-authored; the founder merges** (enforced by branch protection).

## Security

Keep dependencies patched (`npm audit`). This template does not use `next/image`, so
Next's optional `sharp` dependency is not on the runtime path, but you should still
track advisories for anything you add.

## Not in scope

Skill files, MCP, reviewed legal text, live labs/payment integration, and any real
medication content or imagery are separate deliverables — not this template. (The
GROWTH archetype landed in WI-042; see the section above.)
