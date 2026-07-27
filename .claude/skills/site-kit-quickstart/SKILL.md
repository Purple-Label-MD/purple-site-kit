---
name: site-kit-quickstart
description: Stand up a Purple site-kit fork as a live brand site — fork/clone → env creds → offerings → Vercel deploy → custom domain → smoke walk against the hosted Purple API — and know exactly what may and may not be customized. Use when asked to set up, deploy, configure, brand, or launch a purple-site-kit repo (or a fork of it), connect it to an API key / brand ID, wire its domain, customize its look or copy, or diagnose why a kit site isn't talking to the platform.
---

# Site-kit quickstart — fork to live brand site

You are standing up a **fork-and-own client starter** against the hosted Purple platform API.
The kit is distributable product: your fork is the client's site, the platform stays behind ONE
API base, and everything you need arrives as three env values, an assigned catalog, and a domain.
Nothing is mocked anywhere in this path — every failure state is a NAMED, diagnosable answer
(see the tells table).

## Bearings first (always)

Read, in this order, from the repo you are standing in — these are authoritative over this skill
where they differ: `README.md` → `env.example` (the env contract: exact names live HERE) → the
kit's brand-slot/theme docs (the concrete slot inventory lives in-repo) → any `exit-reports/` the
README points at. Never guess an env name; never invent an endpoint — the kit calls only shipped
public contract ops.

## Inputs checklist (collect before touching anything)

- `PURPLE_CLIENT_API_KEY` — the brand's M2M client key. SECRET: env/Vercel-env only, never a file
  in the repo, never chat, never logs. (The platform stores only its digest — a lost key is
  re-minted, never recovered.)
- `PURPLE_BRAND_ID` (`brd_…`) — not a secret.
- `PURPLE_API_BASE` — the ONE API base, an origin (dev: `https://api.dev.purplelabelmd.com`).
  NEVER a lane port, never a path suffix; paths mount under `/v1`.
- **Offerings assigned to the brand in the ADMIN console** (SKUs + pricing + their paired
  qualification questions). This is a PLATFORM precondition, not kit config — see "Offerings"
  below. No assigned offerings ⇒ the site renders honest empty product surfaces.
- Target domain + who controls its DNS (platform-provisioned zone vs. the client's registrar).
- Brand assets/copy for the kit's token/copy slots (logo, palette, name, vetted copy). Slots
  only — see "The customization boundary".

## Offerings: where the products come from

The kit NEVER contains products. Offerings, prices, and their intake/qualification pairings are
**platform truth, per brand**: assigned in the admin console from the catalog, served to the kit
through the API at render time. Consequences you must respect:

- **Never hardcode** a SKU, price, plan name, or "Rx pool" detail into the fork. If it isn't
  coming back from the API for this brand, it doesn't exist on this site.
- The **offering presentation block is canonical on transactional surfaces** (founder-ratified):
  render what the API gives, in the kit's presentation structure — don't re-compose price/terms
  copy by hand.
- Qualification/clinical questions arrive **paired to the offering** by the platform. The kit
  walks them; it never authors, edits, reorders, or skips them.
- Empty product page? That's the honest state for a brand with nothing assigned — the fix is in
  the ADMIN (assign offerings), never a kit-side patch. Say so in your handoff.

## The customization boundary

**Yours to customize (the slots):**
- Brand token slots — logo, name, palette/theme tokens (the kit's design-system slot inventory;
  enumerate from the in-repo docs, don't guess).
- Copy SLOTS the kit explicitly exposes (headlines, support blurbs) — filled with client-provided
  or vetted copy.
- Support contact values (email/phone env slots), domain, and which template surfaces/sections
  the kit's own composition options expose.

**Not yours — structure and law (change requests route upstream, never get hacked in):**
- **INTAKE-SKIN structure** — the intake walk's screen grammar (progress/back/escape, card
  grammar) is a standard; brand expression lives in tokens, not layout surgery.
- **CHECKOUT-SKIN structure** — the checkout anatomy is THE front commerce door standard;
  do not add fields, steps, or restructure it.
- **API calls and auth flows** — shipped public ops only, one base, the kit's existing attach
  patterns; no new endpoints, no token improvisation.
- **Clinical/qualification content** — never write, reword, or remove medical questions; they
  are platform-paired to offerings.
- **Claims and legal copy** — do NOT author medical/therapeutic claims, outcome promises,
  pricing-benefit claims (e.g. HSA/FSA eligibility), or legal pages (T&C, consent, privacy).
  Fill only with copy the client/platform provides as vetted. If asked to "punch up" marketing
  copy on a treatment page: stop and flag for review — claims language is gated.
- **Honest-state semantics** — absent backends/data render the kit's named empty/problem states;
  shipping a fake success or placeholder product is a defect, not a workaround.

Rule of thumb: **if it's a slot, fill it; if it's structure, law, or clinical/claims content,
route it.** A client wanting something outside the slots is a platform/design-system request —
report it upstream with specifics; don't fork the structure.

## Steps

1. **Fork/clone.** Fork the upstream kit into the owning account, clone it. Keep the fork's
   remote separate from upstream; upstream updates arrive by merge, never by copy-paste.
2. **Env.** Copy `env.example` → `.env.local` (gitignored — verify before writing values). Fill
   the trio + slots the example names. Commit NOTHING with a secret; if a key ever lands in a
   commit, stop — it's compromised: report for re-mint, don't rewrite history quietly.
3. **Brand the slots.** Apply tokens/copy per the boundary above. Diff review: slots only.
4. **Verify by automated tests, not standing servers.** Run the kit's suite as-is. Transient dev
   servers under a test runner are fine; deploys are the validation surface (next step).
5. **Vercel.** Create the project from the fork; set env values in Vercel project env; deploy.
   Later changes validate on preview deploy URLs; production promotes from green previews.
6. **Domain.** Add the custom domain to the Vercel project; create the DNS record where the zone
   lives — internal test brands: the platform-provisioned zone record CNAMEs to the Vercel
   target (confirm `dig +short <domain>`); client-owned DNS: hand over the exact record set the
   admin DNS panel issued, verbatim. Cloudflare zones: DNS-only (grey cloud) unless ruled.
7. **Smoke walk (the acceptance).** On the deployed URL: ① brand tokens render, no placeholder
   slots ② the brand's ASSIGNED OFFERINGS render on product surfaces (empty ⇒ assign in admin
   first — platform side) ③ the intake/qualification walk advances with the offering's paired
   questions ④ a checkout session mints (test cards only; `sk_live`-shaped anything is REFUSED
   by design — that refusal is correct) ⑤ evidence: URLs + screenshots per leg + named failure
   states hit.

## The tells table (diagnose, don't guess)

| You see | It means | Fix side |
|---|---|---|
| 401 WITH `x-correlation-id` header | client-key wall — key missing/wrong on the kit's calls | kit env |
| 401 WITHOUT that header | portal-token wall (a portal surface, not the kit's M2M path) | expected on portal routes |
| 403 naming bindings | patient identity unbound — member-portal seed data, not a kit bug | platform (binding row) |
| 404 on `/v1/…` that should exist | wrong `PURPLE_API_BASE`, or platform mount not live | check base, then platform |
| 503/502 naming a lane | that lane backend down/unwired — site is honest, not broken | platform |
| Empty product surfaces | no offerings assigned to this brand | ADMIN (assign), never kit code |
| Placeholder copy/logo | a token/copy slot unfilled | kit slots |

## Hard rules

- Secrets: env stores only; never committed, never logged, never echoed into chat or PR text.
- ONE base: everything through `PURPLE_API_BASE`; lane ports are never kit config, anywhere.
- No hardcoded products, prices, or questions; no mocking; no fake success states.
- The skins are standards; slots are the entire customization surface.
- No authored claims/legal/clinical copy — vetted-copy fills only; flag requests upstream.
- Platform-column findings: report with exact response (status + body + correlation id) —
  never work around them kit-side.

## Handoff evidence

Close with: fork URL + deployed URL + domain resolving (dig output) + the five smoke-walk items
with screenshots + the slot inventory you filled + any platform-column findings and any
customization requests routed upstream.
