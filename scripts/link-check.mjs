#!/usr/bin/env node
/**
 * Internal link check (governance-lite ①).
 *
 * Boots the built app in credential-free mock mode, crawls every internal link
 * reachable from a seed set of pages, and fails if any returns >= 400. Catches dead
 * nav/footer/CTA links before they ship — the shareability discipline the teardown
 * §4 flags (broken/cloaked money pages kill link previews and AI-search visibility).
 *
 * Self-contained: it spawns `next start`, waits for readiness, crawls, then stops.
 * Requires a prior `next build` (the `verify` script runs build first).
 */

import { spawn } from "node:child_process";

const PORT = process.env.LINK_CHECK_PORT || "3123";
const BASE = `http://localhost:${PORT}`;

const SEEDS = [
  "/",
  "/about",
  "/faq",
  "/contact",
  "/members",
  "/members/mock-auth",
  "/webhooks",
  "/status",
  "/start",
  "/checkout",
  "/condition/placeholder-program",
  "/condition/placeholder-program/launch-special",
  "/legal/terms",
  "/legal/privacy",
  "/legal/consent",
  "/legal/returns",
  "/legal/provider-disclosure",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForReady(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { cache: "no-store" });
      if (res.ok) return true;
    } catch {
      // not up yet
    }
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
    if (href.startsWith("/") && !href.startsWith("//")) {
      links.add(href.split("#")[0]);
    }
    m = re.exec(html);
  }
  return [...links].filter(Boolean);
}

async function crawl() {
  const queue = [...SEEDS];
  const seen = new Set();
  const failures = [];
  let checked = 0;

  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);
    let res;
    try {
      res = await fetch(`${BASE}${path}`, { cache: "no-store" });
    } catch (e) {
      failures.push({ path, status: "fetch-error", detail: String(e) });
      continue;
    }
    checked += 1;
    if (res.status >= 400) {
      failures.push({ path, status: res.status });
      continue;
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      const html = await res.text();
      for (const link of extractInternalLinks(html)) {
        // Skip API routes (exercised elsewhere) and already-seen paths.
        if (link.startsWith("/api/")) continue;
        if (!seen.has(link)) queue.push(link);
      }
    }
  }
  return { checked, seen: seen.size, failures };
}

async function main() {
  console.log(`link-check: starting next on ${BASE} …`);
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });

  let exitCode = 0;
  try {
    const ready = await waitForReady();
    if (!ready) {
      console.error("link-check: server did not become ready in time.");
      exitCode = 1;
    } else {
      const { checked, failures } = await crawl();
      if (failures.length) {
        console.error(`\n✗ link-check: ${failures.length} broken link(s):`);
        for (const f of failures) console.error(`  ${f.path} → ${f.status}`);
        exitCode = 1;
      } else {
        console.log(`✓ link-check: ${checked} pages crawled, no broken internal links.`);
      }
    }
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
    if (!server.killed) server.kill("SIGKILL");
  }
  process.exit(exitCode);
}

main();
