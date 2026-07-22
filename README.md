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

## Two-brand theming proof

```bash
NEXT_PUBLIC_PURPLE_BRAND_ID=brd_demo_aurora npm run build && npm start   # purple, long-scroll
NEXT_PUBLIC_PURPLE_BRAND_ID=brd_demo_peer   npm run build && npm start   # terracotta, pre-lander,
                                                                         # + vertical overlay
```

Same code, different data → two fully-themed sites.

## CI — this repo's whole gate (governance-lite)

No six-gate platform apparatus here (no PHI, no money, no platform code). The law is:

- **build + lint** (`biome`)
- **fail-closed copy-guard** — greps the teardown NEVER list (no outcome guarantees,
  no scarcity/urgency theater, no superlative efficacy claims, no unmarked filler) +
  a hardcoded-endpoint check. Proven **RED-first**: `scripts/copy-guard.test.mjs`
  asserts every rule fires on a planted violation *and* the tree is clean, on every run.
- **link check** — boots the built app and crawls internal links.

PRs are **bot-authored; the founder merges** (enforced by branch protection).

## Security

Keep dependencies patched (`npm audit`). This template does not use `next/image`, so
Next's optional `sharp` dependency is not on the runtime path, but you should still
track advisories for anything you add.

## Not in scope

GROWTH archetype, skill files, MCP, reviewed legal text, and any real medication
content or imagery are separate deliverables — not this template.
