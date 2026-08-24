# purple-site-kit — LAUNCH template

A **fork-and-own** single-condition starter site for launching a Purple-powered
DTC telehealth funnel fast. Next.js / Vercel-class, ~12 pages, wired to the Purple
public API. This is **distributable product**, not platform code — you fork it, make
it yours, and deploy it.

> **Why this exists.** Certification (LegitScript-class) reviews a **live site**, and
> payment due-diligence follows certification — so standing the site up is the long
> pole of onboarding. This template compresses that to days. Checkout **hands off** to
> the platform-hosted checkout (WI-084) — this template never collects payment details
> or shows real pricing itself.

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
| `PURPLE_MEMBER_PORTAL_BASE` | The platform-hosted checkout's **origin** (no `/v1`, no path). Server-only. Unset ⇒ the checkout handoff targets an in-kit mock simulation instead. |
| `PURPLE_API_KEY` | Server-only per-client M2M key (`Authorization: Bearer …`). Never exposed to the browser. |
| `PURPLE_WEBHOOK_SECRET` | Server-only HMAC secret for verifying inbound webhook signatures. |

### Your welcome pack → these variables

If you were onboarded with a Purple **welcome pack**, its items map onto this kit as
follows. Every row is verified against the kit's code; items the kit does not read
are marked honestly so you know they belong to the rest of your integration.

| Welcome-pack item | Kit env var | What it does |
| --- | --- | --- |
| **API base URL** (already includes `/v1`) | `NEXT_PUBLIC_PURPLE_API_BASE` | Paste it as-is — do **not** append another `/v1`. Every gateway request is built from it (`lib/config.ts` → `apiBase()`); setting it switches the kit from the built-in mock to live mode. |
| **API key** | `PURPLE_API_KEY` | This exact name — the kit reads `PURPLE_API_KEY`, not `PURPLE_CLIENT_API_KEY` or any other spelling. Presented server-side as `Authorization: Bearer …` on every live call (`lib/purple/client.ts`); never `NEXT_PUBLIC_`-prefixed, never reaches the browser. |
| **Offering ref(s)** | `NEXT_PUBLIC_PURPLE_OFFERING_REF` | Set one ref as the default: the entry-link composer (`lib/purple/entry-links.ts`) preselects it on intake entry links, and the checkout handoff forwards it as `offering_ref`. Got several refs? Keep the rest in your brand/catalog config (`lib/brand/`, `lib/catalog/`) and pass one per link via `EntryContext.offering`. |
| **Member-portal origin** | `PURPLE_MEMBER_PORTAL_BASE` | The platform-hosted checkout's **origin** (no `/v1`, no path — the opposite convention from the API base). The `/checkout` handoff link is composed against it; leave it unset to keep the credential-free mock-checkout walk. |
| **Checkout entry mode** | — *not read by the kit* | Provided for your integration, not read by the kit. It tells you how the hosted checkout sequences payment vs. clinical review for your brand. Kit-side, pick the matching funnel entry in your brand config (`funnelMode: "quiz-first"` or `"buy-first"` on a GROWTH brand); the handoff composer (`lib/purple/checkout-links.mjs`) supports journey-bound and offering-only entry either way. |
| **`{{CLIENT_DOMAIN}}` placeholder** | — *not read by the kit* | Provided for your integration, not read by the kit. Wherever a pack value carries `{{CLIENT_DOMAIN}}`, substitute the domain this fork actually deploys on (e.g. redirect/return URLs, the webhook endpoint URL you register). |

Two variables the pack does **not** carry, because they are your fork's own choices:
`NEXT_PUBLIC_PURPLE_BRAND_ID` (which brand config under `lib/brand/` this build uses)
and `PURPLE_WEBHOOK_SECRET` (the `psig_…` secret shown once when *you* register a
webhook endpoint). `NEXT_PUBLIC_PURPLE_MOCK` is a local override only.

**Zero hardcoded endpoints.** Every Purple call resolves its base URL from
`lib/config.ts`, which reads it from the environment. The copy-guard fails the build
if an absolute API URL literal ever appears in code. The browser never calls the
gateway directly — it calls this app's same-origin BFF routes (`/api/purple/*`),
which attach the key server-side.

> A test credential is not required to build or run. When your dev client is
> provisioned, set the base URL + key and the same code path goes live. The synthetic
> acceptance walkthrough (entry link → full intake → checkout handoff → webhook events)
> runs against the live gateway at that point.

### Handing the build to an agent or contractor

Not building the site yourself? [`AGENT-BRIEF.md`](AGENT-BRIEF.md) is a ready-to-hand
brief for a developer, contractor, or AI agent: fill in its placeholders from your
welcome pack, put the API key in the builder's environment as `PURPLE_API_KEY`, and
hand it over verbatim. It walks the whole job — mock-first bring-up, branding,
pricing, questions, domain, and the live end-to-end proof — and specifies the
deliverables to expect back.

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
  FAQ, Contact, legal slots, member entry, intake host, checkout handoff, status page,
  webhooks console.
- **Purple wiring** — entry-link composer, a **headless intake renderer** (the drop-in
  component: server-authoritative resolve→next loop, one node per screen, exclusive
  options, prefill-always-confirmed, address typeahead, file-capture upload refs,
  abandon) skinned to **INTAKE-SKIN-01** (below), auth-trio pages, a **webhook receiver
  with HMAC verification**, a journey-status read, and a **checkout handoff** to the
  platform-hosted checkout (WI-084) — never a payment field in this template.
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
   refund") and routes to the checkout **handoff** — offering-only, since no journey
   exists yet; the hosted door renders its own honest lock state if it needs health
   questions first — with a direct link onward to the intake renderer either way.
3. **Supply-term selector** — a default-expanded, config-driven term ladder
   (`offering.supplyTerms`); the merchandising surface, not a post-click reveal.
4. **Labs product line** — marketing-complete, **fulfillment-stubbed**: gendered panel
   ladders (basic/intermediate/advanced × audience), panel PDP grammar
   (name → what's tested → why → sample → turnaround), individual-vs-package split, a
   what-we-test transparency page, a how-it-works ritual, and therapy-adjacent panels
   cross-linked as qualification on-ramps. Every labs CTA is fulfillment-stubbed the same
   honest way checkout was before WI-084, until the labs lane (vendor + BAA) ships.

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

## Intake skin (INTAKE-SKIN-01)

The intake renderer ships the kit-wide default question skin — every template and demo
site inherits it; clients customize **tokens only**, never the grammar (INT-A-06):

- **Grammar** — one question per screen, canvas-vs-card depth (cards float on a warm
  canvas; borders near-invisible), centered headline. Selection is **2px accent border +
  filled check, interior stays white** (no tint wash).
- **Behavior** — single-select: click → highlight → ~220ms confirm dwell → auto-advance
  (input locked during dwell); number keys 1–9 select. Multi-select: right-edge check,
  **structural exclusive semantics** (an exclusive "None" clears siblings and vice-versa,
  no error copy) driven by the `option.exclusive` data flag (never inferred from labels).
  240ms slide; `prefers-reduced-motion` ⇒ instant.
- **Chrome** — thin server-fraction progress bar + Back + a persistent "Contact us"
  escape hatch; sticky **Next** pill with visible gating.
- **Theming** — the intake exposes its own `--pl-*` tokens (accent, canvas, ink, surface,
  radius, font), defaulting to **BRAND-01** (`#6D28D9`). A brand rethemes via
  `theme.intake` overrides (see `lib/brand/peer.ts`) — tokens only.
- **Server contract unchanged** — the renderer keeps the resolve→next→complete loop and
  server-supplied progress exactly as shipped; it consumes the ratified option
  presentation model (`{code, label, sub?, exclusive?}`) when present and falls back to
  bare codes + a silent 422 resolution when a live gateway predates it.

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
- **INTAKE-SKIN-01 parity suite** — the skin's acceptance target (spec §7). Logic unit
  tests (`scripts/intake-logic.test.mjs`: exclusive both directions, silent-422 degraded,
  number-key select, gating) + a browser suite (`scripts/parity.mjs`, Playwright/Chromium:
  click→auto-advance, completion bar + Back, reduced-motion instant, and a settled
  computed-style audit) run on **both demo brands** (the tokens-only retheme proof).

PRs are **bot-authored; the founder merges** (enforced by branch protection).

## Security

Keep dependencies patched (`npm audit`). This template does not use `next/image`, so
Next's optional `sharp` dependency is not on the runtime path, but you should still
track advisories for anything you add.

## Not in scope

Skill files, MCP, reviewed legal text, live labs/payment integration, and any real
medication content or imagery are separate deliverables — not this template. (The
GROWTH archetype landed in WI-042; see the section above.)
