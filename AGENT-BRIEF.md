# The Integrator Agent Brief

Hand this brief to whoever builds your Purple-powered storefront — a developer, a
contractor, or your own AI agent. It is written to be handed over **as-is**: fill in
every `{{PLACEHOLDER}}` from your welcome pack, put the API key in the builder's
environment as `PURPLE_API_KEY` (the key never goes into this document), and deliver
the rest verbatim.

## The welcome pack

Your Purple welcome pack contains everything the brief references:

- **API key** — goes into the environment as `PURPLE_API_KEY`, never into this file
- **API base URL** — including `/v1`
- **Brand id**
- **Offering ref(s)**
- **Your domain**
- **The member-portal origin**
- **Your brand's checkout entry mode** — questionnaire-first or direct-buy
- **This site-kit repo's URL**

---

## The brief

You are an independent developer. **{{CLIENT_NAME}}** has hired you to build and launch the storefront for their telehealth brand, **{{BRAND_NAME}}**, which runs on the Purple platform. You have never worked with Purple before.

### Your welcome pack
- **API key** — already in your environment as `PURPLE_API_KEY` (server-side only; never print, log, or commit it)
- **API base URL** — `{{API_BASE}}` (it includes `/v1`; use it exactly — docs examples print a canonical base, always substitute yours)
- **Brand id** — `{{BRAND_ID}}` · **Offering refs** — `{{OFFERING_REFS}}`
- **Your domain** — `{{CLIENT_DOMAIN}}` (already registered; you never buy or register a domain)
- **Member portal origin** — `{{MEMBER_PORTAL_BASE}}`
- **Your brand's checkout mode** — `{{ENTRY_MODE}}` (questionnaire-first or direct-buy; never inferred)
- **The Purple Site Kit** — `{{SITE_KIT_REPO_URL}}`: clone the latest release tag; start with `README.md`, then follow the kit's quickstart runbook end to end
- **Docs** — https://docs.purplelabelmd.com (public)

### The job
1. **Site up — mock first, then live.** Copy `.env.example` → `.env.local` and map your pack into the kit's variable names: key → `PURPLE_API_KEY` · base → `NEXT_PUBLIC_PURPLE_API_BASE` · brand → `NEXT_PUBLIC_PURPLE_BRAND_ID` · offering → `NEXT_PUBLIC_PURPLE_OFFERING_REF` · portal origin → `PURPLE_MEMBER_PORTAL_BASE`. With no API base set, the kit runs a complete built-in mock — prove the mock walkthrough first, then flip to live and re-prove everything. A site that "works" with no credentials is mock mode, not success; the checkout shows a **MOCK HANDOFF** banner — if you ever see it in live mode, your environment is wrong.
2. **Brand it.** Branding is pure config: copy a brand module, set your tokens and copy (docs: *Brand configuration*). Fill every merchandising placeholder — the kit's build guard fails on unmarked placeholders, and that's correct: fix the copy, never the guard.
3. **Price it.** Prices live on the platform, one per brand × offering, in whole USD cents: `PUT /v1/account/brands/{{BRAND_ID}}/pricing`. Your storefront never computes or invents a price — the authoritative price renders on the hosted checkout (docs: *The checkout door*).
4. **Questions — two layers, one hard line.** You author your brand's **qualification** (screening) questions: question library → attach to your offering → **publish** (unpublished changes are invisible to patients). The **medical intake** is clinician-governed — you can never edit it. The kit's renderer walks both as one server-driven questionnaire, one step at a time (docs: *How questions work* · *How serving works*). Add one custom qualification question to one offering and verify it appears in your live intake.
5. **Your domain.** Attach `{{CLIENT_DOMAIN}}` to your hosting, create the DNS records where the zone lives, then tell Purple: `PUT /v1/account/brands/{{BRAND_ID}}/domains/{kind}` (kind = `login` | `member`) and run the verify call. Registrar actions are never part of this job.
6. **Prove it end to end, live, as a fictional test patient:** entry link → your qualification screens → the medical intake → sign-in (the kit's `/api/purple/auth/login` route sends patients to Purple's hosted login — you build no auth) → the hosted checkout at `{{MEMBER_PORTAL_BASE}}/checkout` (enter the standard test card **there** — never build a card field) → the hosted identity check → then watch your `/status` page walk the public journey statuses (docs: *How it works* · *The identity handoff*).

### Mechanics
Every call carries `Authorization: Bearer …` plus `X-Brand-Id: {{BRAND_ID}}`. Every write carries an `Idempotency-Key` header. A 404 can mean wrong brand as easily as wrong path. Errors are structured problem responses that name the field and the rule — read them.

### Hard walls
Never build a card field. Never handle an ID photo. Payment and identity happen only on Purple's hosted pages. Store the webhook signing secret the moment registration returns it — it is shown exactly once.

### Deliverables
1. **The working branded site** — code plus running.
2. **The experience report** — step-by-step log with timings, every stuck point and workaround, and your verdict: would you recommend Purple to a client today, and the top three things to fix. You are scored on the honesty and precision of this report, not on whether everything worked.
3. **Improvement feedback, filed by lever** — sort every issue you hit into the category whose owners can fix it:
   - **The site kit** — bugs, missing pieces, better defaults: **open a pull request against the kit repo** (a failing-test repro PR counts; if you can't push, include patch files in your report).
   - **This brief + the welcome pack + the kit's bundled skills/runbooks** — anything here that was wrong, missing, or misleading: quote the line and propose the replacement wording.
   - **The API docs and guides** — page-by-page: the exact URL, what's wrong or absent, what you needed it to say.
   - **The API itself** — every error verbatim and whether it told you what to do; any endpoint whose name, shape, or behavior surprised you.
4. **The API setup log** — every API call you made during setup, in order: method, path, Idempotency-Key used (y/n), status, one-line outcome. Never include the key, any token, or the webhook secret.
