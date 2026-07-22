#!/usr/bin/env node
/**
 * Per-page meta check (WI-042 · Scope 7 · fail-closed, RED-first).
 *
 * The addendum §4① failure: every URL served the IDENTICAL title/description/OG, so
 * product pages, lab panels, and legal pages were indistinguishable to crawlers,
 * unfurlers, and AI-search. This check fails closed if any crawled page:
 *   1. is missing a <title> or meta description, or
 *   2. still serves the site DEFAULT (unset) title/description, or
 *   3. shares a title or description with another page (duplicate meta), or
 *   4. is missing an og:title / og:description.
 *
 * The pure validator is exported so the RED-first self-test can plant each failure
 * mode and assert it fires — the same discipline as copy-guard. `main()` boots the
 * built app (credential-free mock), crawls, extracts heads, and runs the validator.
 */

import { spawn } from "node:child_process";

/** The site DEFAULT title/description (app/layout.tsx) — a page still showing these is "unset". */
export const DEFAULTS = {
  title: "Purple SITE-KIT — LAUNCH starter (placeholder)",
  description:
    "Fork-and-own single-condition starter template. Placeholder content — replace before launch.",
};

/**
 * Validate a set of crawled pages. Pure — no I/O.
 * @param {{path:string,title?:string,description?:string,ogTitle?:string,ogDescription?:string}[]} pages
 * @param {{title:string,description:string}} defaults
 * @returns {{path:string,rule:string,detail:string}[]}
 */
export function validateMeta(pages, defaults = DEFAULTS) {
  const violations = [];
  const titles = new Map();
  const descriptions = new Map();

  for (const p of pages) {
    const title = (p.title ?? "").trim();
    const description = (p.description ?? "").trim();

    if (!title) violations.push({ path: p.path, rule: "missing-title", detail: "no <title>" });
    if (!description)
      violations.push({ path: p.path, rule: "missing-description", detail: "no meta description" });
    if (title && title === defaults.title)
      violations.push({ path: p.path, rule: "default-title", detail: title });
    if (description && description === defaults.description)
      violations.push({ path: p.path, rule: "default-description", detail: description });
    if (!p.ogTitle)
      violations.push({ path: p.path, rule: "missing-og-title", detail: "no og:title" });
    if (!p.ogDescription)
      violations.push({
        path: p.path,
        rule: "missing-og-description",
        detail: "no og:description",
      });

    if (title) {
      const prev = titles.get(title);
      if (prev) violations.push({ path: p.path, rule: "duplicate-title", detail: `= ${prev}` });
      else titles.set(title, p.path);
    }
    if (description) {
      const prev = descriptions.get(description);
      if (prev)
        violations.push({ path: p.path, rule: "duplicate-description", detail: `= ${prev}` });
      else descriptions.set(description, p.path);
    }
  }
  return violations;
}

// ── Live crawl (only when run as a script) ──────────────────────────────────────

const PORT = process.env.META_CHECK_PORT || "3124";
const BASE = `http://localhost:${PORT}`;

const SEEDS = [
  "/",
  "/about",
  "/faq",
  "/contact",
  "/members",
  "/webhooks",
  "/status",
  "/start",
  "/checkout",
  "/legal/terms",
  "/legal/privacy",
  "/legal/consent",
  "/legal/returns",
  "/legal/provider-disclosure",
  // GROWTH storefront (present under the growth brand build; the §4① target)
  "/group-a",
  "/group-b",
  "/group-a/metabolic-program",
  "/group-b/program-b-only",
  "/labs",
  "/labs/individual",
  "/labs/packages",
  "/labs/what-we-test",
  "/labs/how-it-works",
  "/labs/panel-a-basic",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForReady(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { cache: "no-store" });
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

function extractInternalLinks(html) {
  const links = new Set();
  const re = /href="([^"]+)"/g;
  let m = re.exec(html);
  while (m) {
    const href = m[1];
    if (href.startsWith("/") && !href.startsWith("//")) links.add(href.split("#")[0].split("?")[0]);
    m = re.exec(html);
  }
  return [...links];
}

function pick(re, html) {
  const m = re.exec(html);
  return m ? m[1] : undefined;
}

function extractMeta(path, html) {
  return {
    path,
    title: pick(/<title>([^<]*)<\/title>/i, html),
    description: pick(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i, html),
    ogTitle: pick(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i, html),
    ogDescription: pick(/<meta[^>]+property="og:description"[^>]+content="([^"]*)"/i, html),
  };
}

async function crawl() {
  const queue = [...SEEDS];
  const seen = new Set();
  const pages = [];
  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);
    let res;
    try {
      res = await fetch(`${BASE}${path}`, { cache: "no-store" });
    } catch {
      continue;
    }
    if (res.status >= 400) continue;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) continue;
    const html = await res.text();
    pages.push(extractMeta(path, html));
    for (const link of extractInternalLinks(html)) {
      if (link.startsWith("/api/")) continue;
      if (!seen.has(link)) queue.push(link);
    }
  }
  return pages;
}

async function main() {
  console.log(`meta-check: starting next on ${BASE} …`);
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  let exitCode = 0;
  try {
    if (!(await waitForReady())) {
      console.error("meta-check: server did not become ready in time.");
      exitCode = 1;
    } else {
      const pages = await crawl();
      const violations = validateMeta(pages);
      if (violations.length) {
        console.error(`\n✗ meta-check: ${violations.length} per-page-meta violation(s):`);
        for (const v of violations) console.error(`  ${v.path}  [${v.rule}]  ${v.detail}`);
        exitCode = 1;
      } else {
        console.log(`✓ meta-check: ${pages.length} pages, all with unique, non-default meta + OG.`);
      }
    }
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
    if (!server.killed) server.kill("SIGKILL");
  }
  process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
