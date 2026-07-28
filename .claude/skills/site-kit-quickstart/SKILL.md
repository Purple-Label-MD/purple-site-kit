---
name: site-kit-quickstart
description: Stand up a purple-site-kit fork as a live brand site — fork a release tag, run the credential-free mock walkthrough, flip to live env creds, brand the config slots, deploy to Vercel, wire the domain, and pass the verify chain — knowing exactly what may and may not be customized. Use when asked to set up, deploy, configure, brand, retheme, or launch a purple-site-kit repo (or a fork of it), connect it to an API key / brand ID / offering ref, wire its domain or webhooks, or diagnose why a kit site isn't talking to the Purple platform.
---

# Site-kit quickstart — fork to live brand site

You are standing up a **fork-and-own client starter** (Next.js, npm, Node ≥20.11) against the
hosted Purple platform. The kit is distributable product: your fork is the client's site; the
platform stays behind ONE gateway base; brands are **pure config/tokens** (two archetypes —
LAUNCH single-condition, GROWTH multi-audience storefront — proven by the demo brands). A fresh
clone runs **credential-free against a built-in synthetic mock** by design; going live is an env
flip, not a code change.

## Bearings first (always)

Read from the repo you are standing in — authoritative over this skill where they differ:
`README.md` → `.env.example` (the env contract) → `lib/brand/` (the slot inventory: tokens, copy
slots, merchandising, pattern content, optional vertical overlay) → `docs/certification-readiness.md`
→ `lib/config.ts` (how base/mock resolution actually works). Wire truth for the API lives in the
platform's published contract/docs — the kit calls only shipped public ops (`/instrument/resolve|
next|abandon`, address suggest, the auth trio, journey status, webhooks, checkout when live).

## The env contract (kit-specific — do NOT reuse portal env names)

From `.env.example` → `.env.local` (git-ignored; verify before writing values):

- `NEXT_PUBLIC_PURPLE_API_BASE` — the public gateway base **INCLUDING `/v1`**
  (e.g. `https://api.dev.purplelabelmd.com/v1`). **Unset ⇒ built-in mock mode.** Note this
  differs from the platform portals' origin-only convention — the kit wants the `/v1` suffix.
- `NEXT_PUBLIC_PURPLE_MOCK` — explicit mock override; set `false` alongside a real base to go live.
- `NEXT_PUBLIC_PURPLE_BRAND_ID` (`brd_…`) — selects the active `lib/brand/` config at
  build/deploy time AND rides as `X-Brand-Id` on tenant-scoped calls.
- `NEXT_PUBLIC_PURPLE_OFFERING_REF` — the offering preselected on entry links. Always a stable
  ref from the brand's ASSIGNED catalog — never a free-text product name.
- `PURPLE_API_KEY` — server-only M2M key (`Authorization: Bearer …`). SECRET. Never
  `NEXT_PUBLIC_`-prefixed, never committed, never logged, never in chat. (Platform stores only
  its digest — lost keys are re-minted, never recovered.)
- `PURPLE_WEBHOOK_SECRET` — server-only HMAC secret (`psig_…`), **shown ONCE at webhook-endpoint
  registration**; verifies `X-Purple-Signature` on the kit's webhook receiver.
- `PURPLE_MEMBER_PORTAL_BASE` (WI-084) — the platform-hosted checkout's ORIGIN, **no `/v1`, no
  path, no trailing slash** (the opposite convention from the API base above — this is a page
  host, not an API mount). Server-only. **Unset ⇒ the checkout handoff targets an in-kit mock
  simulation** instead of a real payment surface — same shape, credential-free.

**The BFF rule:** the browser NEVER calls the gateway. All Purple calls go through this app's
same-origin `/api/purple/*` routes, which attach the key server-side. Zero hardcoded endpoints —
the copy-guard FAILS THE BUILD on any absolute API URL literal. Keep it that way.

## Offerings: where the products come from

The kit contains NO products. Offerings, prices, and their paired qualification/intake questions
are **platform truth, per brand** — assigned in the Purple admin console, served at render time
(`/catalog`, `/brands/{brand_id}/offerings`, and the intake loop's server-authoritative nodes).

- **Never hardcode** a SKU, price, plan, or question into the fork. GROWTH's `lib/catalog/`
  config is projection/lens config (audience set-membership on offerings — never a cloned SKU,
  never a second catalog), not a product database.
- The intake renderer is **headless and server-authoritative** (resolve→next, one node per
  screen): the kit walks the questions the platform pairs to the offering; it never authors,
  edits, reorders, or skips them.
- Empty product surfaces in live mode = no offerings assigned to this brand — the fix is in the
  ADMIN, never a kit-side patch. Say so in your handoff.

## The customization boundary

**Yours (the slots — all in config):**
- A brand config module under `lib/brand/` (copy `aurora.ts`): logo/palette/type tokens, copy
  slots, merchandising, pattern content, optional vertical overlay. Tokens → CSS vars; a full
  reskin is config-only (the demo brands prove it — `npm run parity:retheme` audits exactly this).
- Marked placeholder copy — swap for real, reviewed content (the copy-guard blocks unmarked
  filler, but marked slots still need real copy before launch).
- Clinician bios — a first-class slot; fill with REAL, verifiable providers only.
- Entry-link composition (`NEXT_PUBLIC_PURPLE_OFFERING_REF` per campaign), domain, host env.

**Not yours — structure and law (route change requests upstream; never hack them in):**
- **INTAKE-SKIN structure** — the headless renderer's screen grammar (exclusive options,
  prefill-always-confirmed, progress/back/escape) is a standard; brand expression = tokens only.
- **The checkout surface** — its anatomy is the platform's commerce-door standard, hosted on the
  member origin (`PURPLE_MEMBER_PORTAL_BASE`), never in this kit. As of WI-084, `/checkout`
  **composes a handoff link** — it carries `offering_ref` always, plus `journey_id` for the
  primary post-intake entry (the intake renderer's completion step) or, for a buy-first entry
  with no journey yet, `offering_ref` alone — the hosted door itself renders the honest lock
  state if it needs health questions first. Never add a payment field, never fabricate a
  `sku_id`/`therapy` value the kit wasn't given, never build a payment path around the door.
  Forks from v0.1.0-era tags instead ship the pre-wake checkout STUB — upgrade the tag to get
  the handoff. **Known limitation:** the kit's status page shows journey status only — there is
  no public order-read op or commerce webhook family on the platform yet, so order/payment truth
  past "handed off" isn't observable from the kit (see the WI-084 exit report if you need the
  detail; don't invent a workaround here).
- **The verify chain** — `npm run verify` (lint · copy-guard + its self-test · intake-logic
  parity · catalog projection tests · meta/link checks · multi-brand builds · retheme parity) is
  the acceptance law. Never weaken a guard to make a build pass; fix the content.
- **Legal pages** — `/legal/*` and the disclaimer stack ship as `REQUIRES COUNSEL REVIEW`
  placeholders; the reviewed legal pack is a separate counsel-gated deliverable. Never author it.
- **Claims** — do NOT write medical/therapeutic claims, outcome promises, or pricing-benefit
  claims (e.g. HSA/FSA eligibility). Vetted copy fills only; "punch up the treatment page" =
  stop and flag for review. Testimonials keep their built-in results-vary disclaimer; the seal
  slot is placement-only — never ship a certification seal you don't hold.
- **The BFF + config discipline** — no direct browser→gateway calls, no endpoint literals, no
  key exposure, no new API surface.

Rule of thumb: **if it lives in a brand config module or a marked slot, fill it; if it's
structure, a guard, legal, clinical, or claims — route it.**

## Steps

1. **Fork a released TAG, not main-tip** (e.g. `v0.1.0`) into the owning account; clone. Upstream
   updates arrive by deliberate merge of a newer tag.
2. **Prove the mock walkthrough first** (credential-free): `npm install && npm run dev`, walk
   entry link → intake → checkout handoff (mock hosted-checkout simulation → mock pay) → status
   page shows the advanced state → webhooks console. This baselines "the kit works" before any
   credential enters the picture.
3. **Brand the slots.** New config module under `lib/brand/` (copy `aurora.ts`), set
   `NEXT_PUBLIC_PURPLE_BRAND_ID` to it, fill tokens/copy/bios per the boundary above.
4. **`npm run verify`** — the full chain, green, before any deploy.
5. **Go live env.** `.env.local` (and later Vercel env): real base **with `/v1`**, brand id,
   offering ref from the ASSIGNED catalog, server-only key. Mock turns off by presence of the
   base (set `NEXT_PUBLIC_PURPLE_MOCK=false` to be explicit). Set `PURPLE_MEMBER_PORTAL_BASE`
   (an origin, no `/v1`) to send the checkout handoff to the real hosted door instead of the mock
   simulation. A `sk_live`-shaped anything is refused platform-side by design — test credentials
   only in dev.
6. **Vercel.** Project from the fork; env vars in project settings (server-only secrets never
   `NEXT_PUBLIC_`); deploy. Previews validate every change; production promotes from green.
7. **Webhooks.** Register the deployed receiver URL with the platform; capture the `psig_…`
   secret AT REGISTRATION (shown once) into `PURPLE_WEBHOOK_SECRET`; prove a signed event
   verifies in the webhooks console.
8. **Domain.** Add to the Vercel project; create the DNS record where the zone lives (platform-
   provisioned test zones CNAME to the Vercel target — confirm `dig +short <domain>`; client-
   owned DNS gets the admin panel's record set verbatim; Cloudflare zones stay DNS-only).
9. **Live smoke (the acceptance).** On the deployed URL: ① brand tokens render, zero unmarked
   placeholders ② ASSIGNED offerings render (empty ⇒ assign in admin) ③ the intake walk advances
   with the offering's paired questions ④ checkout per the fork's era (pre-wake tags render the
   honest STUB; WI-084-and-later tags compose the handoff — `PURPLE_MEMBER_PORTAL_BASE` set ⇒ it
   lands on the real hosted door and a test card confirms; unset ⇒ the mock simulation) ⑤ webhook
   event verified ⑥ evidence: URLs + screenshots per leg + named failure states hit.

## The tells table (diagnose, don't guess)

| You see | It means | Fix side |
|---|---|---|
| Site "works" with no creds | mock mode (by design) — check `NEXT_PUBLIC_PURPLE_API_BASE` | env, when you MEANT live |
| 404s on every live call | base missing the `/v1` suffix, or wrong base | kit env |
| 401 WITH `x-correlation-id` | client-key wall — `PURPLE_API_KEY` missing/wrong server-side | kit env |
| 503/502 naming a lane | that platform lane down/unwired — site is honest, not broken | platform |
| Empty product surfaces (live) | no offerings assigned to this brand | ADMIN, never kit code |
| Webhook signature rejects | wrong/rotated `psig_…` secret | re-register / env |
| Build fails on copy-guard | unmarked filler or an endpoint literal | fix content, never the guard |
| Placeholder copy renders | a marked slot unfilled | brand config |
| "This checkout link isn't complete" | no `offering_ref` resolvable (no entry param, no configured default) | entry link / `NEXT_PUBLIC_PURPLE_OFFERING_REF` |
| Checkout hands off to the mock simulation in live mode | `PURPLE_MEMBER_PORTAL_BASE` unset | kit env |
| Hosted checkout asks for health questions on a buy-first link | expected — no `sku_id`/`therapy` source exists yet; this is the honest lock state, not a bug | platform (no public fix side today) |

## Handoff evidence

Fork URL (tag noted) + deployed URL + domain dig output + `npm run verify` green + the six live
smoke items with screenshots + the brand-config slot inventory filled + any platform-column
findings and customization requests routed upstream.
