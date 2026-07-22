#!/usr/bin/env node
/**
 * Fail-closed copy-guard (governance-lite ① / teardown §4 NEVER list).
 *
 * Greps shippable content for compliance red-flags and fails the build on any hit.
 * The rules encode the four text-tractable lines of the NEVER list plus a
 * hardcoded-endpoint check (zero hardcoded endpoints is an acceptance criterion):
 *
 *   1. outcome-guarantee     — guaranteed results/outcomes on a medical product
 *   2. scarcity-urgency      — stock/urgency theater on prescription products
 *   3. superlative-efficacy  — superlative or "clinically proven" efficacy claims
 *   4. unmarked-filler       — lorem ipsum / TODO / FIXME shipped as content
 *   5. hardcoded-endpoint    — an absolute API URL literal in app/component/lib code
 *
 * The structural §4 items (faceless clinician, sitemap hygiene, missing bylines) are
 * NOT greppable — they live in the certification-readiness checklist instead.
 *
 * Escape hatch: a line containing `copyguard-allow` is exempt from the text rules
 * (rules 1–4). Use it ONLY for meta-discussion of the NEVER list itself (docs that
 * quote a banned phrase as an example). It never exempts real marketing copy.
 *
 * This module exports its rule engine so the RED-first self-test can prove each rule
 * fires on a planted violation and that the real tree is clean.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const ALLOW_MARKER = "copyguard-allow";

/** @typedef {{id:string, description:string, regex:RegExp, appliesTo:(rel:string)=>boolean}} Rule */

const isContent = (rel) => /^(app|components|lib|docs)\//.test(rel) || rel === "README.md";
const isCode = (rel) =>
  /^(app|components|lib)\//.test(rel) && /\.(ts|tsx)$/.test(rel) && rel !== "lib/config.ts";

/** @type {Rule[]} */
export const RULES = [
  {
    id: "outcome-guarantee",
    description: "Guaranteed results/outcomes on a medical product (FTC exposure).",
    regex:
      /(?<!not\s)(?<!never\s)\bguarantee(?:d|s)?\s+(?:results?|outcomes?|weight\s*loss|success|to\s+(?:lose|cure|work))\b|\b(?:results?|outcomes?|weight\s*loss)\s+(?:are\s+)?guaranteed\b/i,
    appliesTo: isContent,
  },
  {
    id: "scarcity-urgency",
    description: "Stock-scarcity or pseudo-clinical urgency theater on Rx products.",
    regex:
      /\b(?:only\s+\d+\s+left|while\s+supplies\s+last|act\s+now|offer\s+ends|approval\s+window\s+(?:ends|closes)|limited[-\s]time\s+offer|spots?\s+(?:remaining|left)|selling\s+(?:out|fast)|don'?t\s+miss\s+out|hurry[,!\s])/i,
    appliesTo: isContent,
  },
  {
    id: "superlative-efficacy",
    description: "Superlative or unqualified efficacy claims on a prescription product.",
    regex:
      /\b(?:most\s+effective|#\s?1\b|best[-\s]selling|clinically\s+proven|miracle\s+(?:cure|drug|treatment)|guaranteed\s+cure|melts?\s+(?:away\s+)?fat|lose\s+\d+\s*(?:lbs?|pounds))\b/i,
    appliesTo: isContent,
  },
  {
    id: "unmarked-filler",
    description: "Unmarked placeholder filler (lorem ipsum / TODO / FIXME) shipped as content.",
    regex: /lorem\s+ipsum|\bTODO\b|\bFIXME\b|\bXXX+\b/,
    appliesTo: isContent,
  },
  {
    id: "hardcoded-endpoint",
    description: "Absolute API URL literal in code — endpoints must be config-driven.",
    regex: /["'`]https?:\/\/(?!localhost|127\.0\.0\.1)[a-z0-9.-]+\.[a-z]{2,}/i,
    appliesTo: isCode,
  },
];

const SKIP_DIRS = new Set([".git", ".next", "node_modules", "scripts", ".vercel", "out"]);
const SCAN_EXT = new Set([".ts", ".tsx", ".md"]);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (SCAN_EXT.has(extname(name))) acc.push(full);
  }
  return acc;
}

/** Scan a single string; returns [{ruleId, line, text}]. `rel` decides which rules apply. */
export function scanContent(text, rel) {
  const violations = [];
  const lines = text.split(/\r?\n/);
  for (const rule of RULES) {
    if (!rule.appliesTo(rel)) continue;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (rule.id !== "hardcoded-endpoint" && line.includes(ALLOW_MARKER)) continue;
      if (rule.regex.test(line)) {
        violations.push({ ruleId: rule.id, line: i + 1, text: line.trim().slice(0, 120) });
      }
    }
  }
  return violations;
}

/** Scan the whole repo. Returns [{file, ...violation}]. */
export function scanRepo() {
  const files = walk(ROOT);
  const out = [];
  for (const file of files) {
    const rel = relative(ROOT, file).split("\\").join("/");
    const text = readFileSync(file, "utf8");
    for (const v of scanContent(text, rel)) out.push({ file: rel, ...v });
  }
  return out;
}

// Run as a script: fail closed on any violation.
if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = scanRepo();
  if (violations.length) {
    console.error(`\n✗ copy-guard: ${violations.length} violation(s) of the NEVER list:\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  [${v.ruleId}]  ${v.text}`);
    }
    console.error("\nFix the copy (or add `copyguard-allow` on a genuine meta-discussion line).\n");
    process.exit(1);
  }
  console.log("✓ copy-guard: clean — no NEVER-list violations found.");
}
