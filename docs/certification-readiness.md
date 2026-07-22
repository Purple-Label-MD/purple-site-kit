# Certification-readiness checklist (LAUNCH template)

> **Scope of this doc.** A working checklist of the site elements a certification
> review (LegitScript-class) expects to find on a live DTC telehealth site, mapped
> to where this template provides them. **Every legal/consent/disclosure surface
> ships as a MARKED PLACEHOLDER with a `REQUIRES COUNSEL REVIEW` banner.** This
> template does not contain, and must never contain, reviewed legal text — the
> reviewed legal pack is a separate, counsel-gated deliverable (SITE-KIT
> decomposition ③), expressly **not** this work item.
>
> Nothing here is legal advice. Do not treat a checked box as compliance; treat it
> as "the surface exists and is ready for counsel + your compliance team to fill."

## Why the site is the long pole

Certification review inspects a **live site**, and payment due-diligence follows
certification — so standing the site up is the critical path to onboarding. This
template compresses that to days by shipping every required surface as a ready slot.

## Identity & contact surfaces

- [ ] **Company / operating-entity identity** — `/about` (identity slots) + footer.
- [ ] **Reachable contact surface** (email, phone, mailing address, hours) — `/contact`.
- [ ] **Platform-vs-medical-practice separation disclosure** — `/about`, `/legal/provider-disclosure`.

## Provider & clinical surfaces

- [ ] **Provider disclosure** (who prescribes, entity separation, licensure) — `/legal/provider-disclosure`.
- [ ] **Clinician identity** (named, credentialed bios) — clinician-bio slots on `/about` and program pages. *(The estate-wide leapfrog: real, named providers. Shipped as first-class slots — fill them.)*
- [ ] **Balanced safety information** (risks, contraindications, side effects) — FAQ battery + condition-page education slots.

## Legal / policy surfaces (all REQUIRES-COUNSEL-REVIEW placeholders)

- [ ] **Terms & Conditions** — `/legal/terms`.
- [ ] **Privacy Policy** (incl. HIPAA posture) — `/legal/privacy`.
- [ ] **Consent** (telehealth informed consent; consent-to-record where a capture step requires it) — `/legal/consent`.
- [ ] **Returns & fulfillment policy** (cancellation window surfaced at point of sale; medication-return reality) — `/legal/returns`.
- [ ] **Layered disclaimer stack** (product-status / clinician-required / privacy) — site footer slots.

## Merchandising & claims hygiene (enforced by the copy-guard)

- [ ] **No outcome guarantees** — hedged language only ("may", "if appropriate", "results vary").
- [ ] **No scarcity / urgency theater** on prescription products.
- [ ] **No superlative efficacy claims** ("most effective", etc.) — neutral role labels only. <!-- copyguard-allow: NEVER-list example -->

- [ ] **No unmarked placeholder copy** shipped to production — every slot is visibly marked.
- [ ] **Results-vary disclaimer** on every testimonial surface — built into the component.
- [ ] **Consistent pricing** across all surfaces; itemize inclusions rather than implying a single bundled promise that contradicts the actual billing model.

## Structural / hygiene items (checklist, not lint)

- [ ] Money/intake pages are **shareable** (not bot-cloaked); link previews and AI-search work.
- [ ] Funnel internals are **not** exposed in a public sitemap in a way that invites abuse.
- [ ] YMYL content carries **medical-reviewer bylines** where applicable.
- [ ] No competitor-login / conquest content (brand-diluting, legally gray).

## Before you launch

1. Replace **every** placeholder (the copy-guard fails the build on unmarked placeholders,
   but you must still replace the *marked* ones with real, reviewed content).
2. Have **counsel** draft and approve every `/legal/*` surface and the disclaimer stack.
3. Have your **compliance team** review merchandising copy against the NEVER list.
4. Fill clinician bios with **real, verifiable** provider identities.
5. Confirm pricing is consistent and honestly itemized across every surface.
