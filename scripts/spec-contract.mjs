#!/usr/bin/env node
/**
 * spec-contract — the kit's SPEC-ANCHORED, FAIL-CLOSED projection instrument.
 *
 * ─── WHY THIS EXISTS ────────────────────────────────────────────────────────────────────────
 * The platform's docs pipeline guarantees spec↔docs coherence BY CONSTRUCTION: the reference is
 * PROJECTED from the contract, fail-closed, and a live-drift probe byte-compares what the site
 * actually serves. Nothing did that for THIS repo. The kit's called paths, its env table, and its
 * README claims were six independent hand-maintained restatements of the same platform truth —
 * and they had drifted: a called path the spec does not publish, a base-URL convention documented
 * two ways, and three different vocabularies for one entry-mode toggle, all undetected across four
 * integrator walks. Kit CI was 14 steps of self-reference; not one of them touched the spec.
 *
 * The fix is PROJECTION, NOT PROOFREADING. `integration-contract.json` states the truth once;
 * `spec/published-surface.json` pins what the platform actually publishes; this file projects
 * both onto the code and the docs and reds on any daylight between them.
 *
 * ─── THE FOUR CHECKS ────────────────────────────────────────────────────────────────────────
 *   1  called-path existence — every platform path the kit's CODE calls, and every platform path
 *      its DOCS instruct a reader to call, exists in the published surface with that method.
 *   2  base-URL convention  — the API base includes the version prefix and is pasted as-is; the
 *      page-host bases do not. Doubling is a build failure, on the code side AND the docs side,
 *      and the spec side of the convention is asserted too (server must not carry the prefix).
 *   3  claims-as-assertions — the env table, its wire effects, and the two Architect-ruled
 *      reconciling sentences are executable checks, not prose anyone has to remember to reread.
 *   4  (see scripts/spec-contract-live.mjs) the same checks re-run against the LIVE published
 *      spec, with drift and live-fetch-failure kept as DISTINCT verdicts.
 *
 * ─── AND THE PART A SILENT GATE TAUGHT US ───────────────────────────────────────────────────
 * A fail-closed gate that JAMS is how "it cannot drift" becomes false with nobody noticing: the
 * platform's own docs-projection sat red on main for days, publishing frozen at its last-good
 * artifact, and nothing said so. So every check here declares HOW MANY things it examined and
 * reds below a floor (a scanner that stopped seeing call sites must never read as "the call sites
 * are fine"), and the PR-time run asserts that a LIVE verification concluded inside the freshness
 * window. Past that window the verdict is JAMMED — printed as loudly as DRIFT, and never a pass.
 *
 * Usage:
 *   node scripts/spec-contract.mjs                      # check against the pinned surface
 *   node scripts/spec-contract.mjs --surface <file>      # check against another surface
 *   node scripts/spec-contract.mjs --root <dir>          # check another tree (the RED-first tests)
 */
import { appendFileSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { REPO_ROOT, SURFACE_PATH, isEntrypoint } from "./spec-surface.mjs";

export const CONTRACT_FILE = "integration-contract.json";
export const KNOWN_GAPS_FILE = "known-gaps.json";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".js", ".jsx"]);
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// ── small shared helpers ──────────────────────────────────────────────────────────────────────

export function readContract(root) {
  return JSON.parse(readFileSync(join(root, CONTRACT_FILE), "utf8"));
}

function readIfPresent(root, relPath) {
  try {
    return readFileSync(join(root, relPath), "utf8");
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries.sort()) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".git")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * Collapse every dynamic segment to `{}` so a template literal, a `{{PLACEHOLDER}}`, a Next.js
 * `[slug]` and an OpenAPI `{brand_id}` all compare on SHAPE. Matching on parameter NAMES would
 * make the check hostage to spelling, which is not what "does this path exist" means.
 */
export function normalizePath(path) {
  return path
    .replace(/\$\{[^}]*\}/g, "{}") // `${encodeURIComponent(id)}`
    .replace(/\{\{[^}]*\}\}/g, "{}") // `{{BRAND_ID}}`
    .replace(/\{[^}]*\}/g, "{}") // `{brand_id}` / `{kind}`
    .replace(/\[[^\]]*\]/g, "{}") // Next.js `[slug]`
    .replace(/\/\*/g, "/{}") // `/legal/*`
    .replace(/\/+$/, "");
}

// ── the kit's OWN routes, DERIVED (never a hand-kept allow-list) ──────────────────────────────

/**
 * The set of same-origin routes this app serves, read straight off the App Router tree. This is
 * what lets the doc scanner tell "a path the reader should call on the PLATFORM" from "a path on
 * this very site" without anybody maintaining a list of exceptions — the exact hand-maintenance
 * this instrument exists to abolish.
 */
export function localRoutes(root) {
  const appDir = join(root, "app");
  const routes = new Set();
  for (const file of walk(appDir)) {
    const rel = relative(appDir, file).split(sep).join("/");
    const m = rel.match(/^(.*)\/(page|route)\.(tsx?|jsx?|mjs)$/);
    if (!m) continue;
    const segments = m[1]
      .split("/")
      .filter((s) => s !== "" && !(s.startsWith("(") && s.endsWith(")")));
    routes.add(normalizePath(`/${segments.join("/")}`) || "/");
  }
  return routes;
}

/**
 * Dynamic-segment-aware route match: the route `/legal/{}` (from `app/legal/[slug]`) is what the
 * docs mean when they write `/legal/terms`. A literal set-membership test would call every
 * concrete instance of a dynamic route an unpublished platform path.
 */
export function matchesLocalRoute(candidate, routes) {
  const parts = candidate.split("/");
  const fullyDynamic = parts.slice(1).every((s) => s === "{}");
  for (const route of routes) {
    const routeParts = route.split("/");
    if (routeParts.length !== parts.length) continue;
    if (!routeParts.every((seg, i) => seg === "{}" || seg === parts[i])) continue;
    // A LITERAL ANCHOR is required. This kit's GROWTH archetype serves `/{audience}`, a
    // root-level dynamic route that would otherwise absorb every single-segment path a document
    // mentions — including platform operations like `/catalog`. So a concrete path is only this
    // app's route if it shares at least one literal segment with it; `/legal/terms` anchors on
    // `legal` and is ours, `/catalog` anchors on nothing and is not.
    // `i > 0` skips the empty segment before the leading slash, which every path shares and which
    // would otherwise make every route look anchored.
    const anchored = routeParts.some((seg, i) => i > 0 && seg !== "{}" && seg === parts[i]);
    if (anchored || fullyDynamic) return true;
  }
  return false;
}

// ── check 1a: call sites in code ──────────────────────────────────────────────────────────────

/**
 * Every gateway request in this kit is built as `` `${apiBase()}<path>` `` — that is the repo's
 * zero-hardcoded-endpoints law, already enforced by the copy-guard. So the call-site census is
 * exact: find the accessor inside a template literal, take the path up to the query string, and
 * read the request method out of the fetch options that follow.
 */
export function scanCallSites(root, contract) {
  const accessor = contract.apiBase.accessor;
  const pattern = new RegExp(`\\$\\{${accessor}\\(\\)\\}([^\`]*)\``, "g");
  const sites = [];
  for (const dir of contract.callSiteGlobs) {
    for (const file of walk(join(root, dir))) {
      if (!SOURCE_EXTENSIONS.has(file.slice(file.lastIndexOf(".")))) continue;
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(pattern)) {
        const rawPath = match[1].split("?")[0];
        // The request method rides in the options object that follows the URL. `fetch` defaults
        // to GET when none is given, and so do we — deliberately, so an options-less call is
        // still checked rather than silently dropped from the census.
        const after = text.slice(
          match.index + match[0].length,
          match.index + match[0].length + 400,
        );
        const methodMatch = after.match(/method:\s*["'`](GET|POST|PUT|PATCH|DELETE)["'`]/);
        sites.push({
          file: relative(root, file).split(sep).join("/"),
          line: text.slice(0, match.index).split("\n").length,
          method: methodMatch ? methodMatch[1] : "GET",
          path: rawPath,
          normalized: normalizePath(rawPath),
        });
      }
    }
  }
  return sites;
}

// ── check 1b: platform paths the DOCS tell a reader to call ───────────────────────────────────

const BACKTICKED = /`([^`\n]+)`/g;
const PATHISH = /^\/[A-Za-z0-9_\-./*{}[\],:]+$/;

/**
 * A documented platform path is a backticked absolute path that is NOT one of this app's own
 * routes and NOT under `/api/` (the kit's same-origin BFF surface — by contract the browser never
 * calls the gateway directly, so everything under `/api/` is local by construction).
 *
 * Both lawful spellings are accepted and reconciled here, which is the whole point: the DOCS
 * convention writes the version prefix into the path (`PUT /v1/account/...`, because the docs
 * `servers` value is origin-only), while the KIT convention leaves it in the base
 * (`/instrument/resolve`, because `NEXT_PUBLIC_PURPLE_API_BASE` already ends in `/v1`). Whichever
 * way it is written, it has to land on the same published operation.
 */
export function scanDocPathRefs(root, contract, surface) {
  const routes = localRoutes(root);
  const prefix = surface.versionPrefix;
  const refs = [];
  for (const relPath of contract.docPathScanFiles) {
    const text = readIfPresent(root, relPath);
    if (text === null) continue;
    const lines = text.split("\n");
    lines.forEach((line, idx) => {
      for (const match of line.matchAll(BACKTICKED)) {
        const inner = match[1].trim();
        const methodMatch = inner.match(new RegExp(`^(${HTTP_METHODS.join("|")})\\s+(/\\S+)$`));
        const method = methodMatch ? methodMatch[1] : null;
        const candidate = methodMatch ? methodMatch[2] : inner;
        if (!PATHISH.test(candidate)) continue;
        const normalized = normalizePath(candidate.split("?")[0]);
        // The bare version prefix is the CONVENTION being discussed ("the base including `/v1`"),
        // never an operation. Check 2 owns everything that token means.
        if (normalized === prefix) continue;
        if (normalized.startsWith("/api/") || normalized === "/api") continue;
        if (matchesLocalRoute(normalized, routes)) continue;
        // A path already written in the docs convention keeps its prefix; one written in the kit
        // convention gets it folded in. Either way we compare absolute published paths.
        const published = normalized.startsWith(`${prefix}/`)
          ? normalized
          : `${prefix}${normalized}`;
        refs.push({
          file: relPath,
          line: idx + 1,
          method,
          path: candidate,
          normalized,
          published,
        });
      }
    });
  }
  return refs;
}

// ── the published surface, indexed ────────────────────────────────────────────────────────────

function indexSurface(surface) {
  const byPath = new Map();
  for (const op of surface.ops) {
    const key = normalizePath(op.path);
    if (!byPath.has(key)) byPath.set(key, new Set());
    byPath.get(key).add(op.method);
  }
  return byPath;
}

// ── sentence-level claim assertions ───────────────────────────────────────────────────────────

/**
 * Claims are asserted at SENTENCE granularity on purpose. "The document mentions both words
 * somewhere" is satisfied by two unrelated paragraphs; a RECONCILING sentence is the thing the
 * Architect actually ruled must exist, so that is what gets checked. Markdown table cells count
 * as sentences — a mapping stated in a table row is a perfectly good reconciliation.
 */
export function sentences(text) {
  return text
    .split(/\n\s*\n|\n[-*]\s|(?<=[.!?])\s+|\|/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 0);
}

function sentenceCarriesAll(text, tokens) {
  return sentences(text).some((sentence) => {
    const lower = sentence.toLowerCase();
    return tokens.every((token) => lower.includes(token.toLowerCase()));
  });
}

// ── env-table projection ──────────────────────────────────────────────────────────────────────

export function parseEnvExample(text) {
  const entries = new Map();
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (m) entries.set(m[1], m[2].trim());
  }
  return entries;
}

/**
 * The DOCUMENTATION BLOCK a variable is discussed in — a paragraph, a comment block above its
 * assignment, a markdown table row, or a bullet item. A fixed ±N line window gets this wrong in
 * both directions (an env template states the convention four lines above the assignment; a
 * markdown table would swallow every sibling row and let one row's `/v1` excuse another's).
 *
 * `owns` marks the block where the variable is DEFINED rather than merely referenced: an
 * assignment line, or a row/bullet whose FIRST backticked token is the variable. Convention
 * restatements and example URLs are asserted only against owning blocks — a passing cross-
 * reference owes nothing, but the place a variable is defined owes the whole convention.
 */
export function documentationBlocks(text, varName) {
  const lines = text.split("\n");
  const runs = [];
  let start = null;
  lines.forEach((line, idx) => {
    if (line.trim() === "") {
      if (start !== null) runs.push([start, idx - 1]);
      start = null;
    } else if (start === null) {
      start = idx;
    }
  });
  if (start !== null) runs.push([start, lines.length - 1]);

  const blocks = [];
  for (const [from, to] of runs) {
    // A markdown table or bullet list is a run of INDEPENDENT units; split it so one row cannot
    // vouch for another.
    let current = null;
    for (let i = from; i <= to; i += 1) {
      const line = lines[i];
      const isUnitStart = /^\s*\|/.test(line) || /^\s*(?:[-*+]|\d+[.)])\s/.test(line);
      if (isUnitStart || current === null) {
        if (current) blocks.push(current);
        current = { line: i + 1, lines: [line] };
      } else {
        current.lines.push(line);
      }
    }
    if (current) blocks.push(current);
  }

  // A DEFINITION, not a mention: the assignment line in an env template, the first cell of a
  // markdown table row, the head of a bullet, or a heading. A troubleshooting row that happens to
  // name the variable is a cross-reference and owes nothing.
  const q = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ownsPatterns = [
    new RegExp(`^\\s*(?:#\\s*)?${q}=`),
    new RegExp(`^\\s*\\|\\s*\\**\`${q}\``),
    new RegExp(`^\\s*(?:[-*+]|\\d+[.)])\\s*\\**\`${q}\``),
    new RegExp(`^\\s*#+\\s*\`?${q}`),
  ];
  const ownsVar = (line) => ownsPatterns.some((p) => p.test(line));

  return blocks
    .filter((b) => b.lines.some((l) => l.includes(varName)))
    .map((b) => ({
      line: b.line,
      text: b.lines.join(" "),
      owns: b.lines.some(ownsVar),
    }));
}

/**
 * Concrete URLs only. `https://api.<your-gateway>/v1` and `{{API_BASE}}` are placeholders — a
 * reader substitutes them, so asserting their shape is asserting the shape of a blank.
 */
const URL_IN_TEXT = /https?:\/\/[^\s`)'"|]+/g;

export function concreteUrls(text) {
  return (text.match(URL_IN_TEXT) ?? [])
    .map((u) => u.replace(/[.,;:]+$/, "").replace(/\/+$/, ""))
    .filter((u) => !/[<>{}]/.test(u));
}

// ── the known-gaps register ───────────────────────────────────────────────────────────────────

/**
 * THE REGISTER, AND WHY IT IS NOT A WAIVER LIST.
 *
 * The audit that produced this instrument found real drift that this repo is not the owner of
 * (a platform op the spec does not publish; wording rulings whose cure belongs to the doc owner).
 * Landing the instrument red would make it background noise inside a week; curing findings this
 * instrument exists to DETECT would be marking its own homework. So an open finding is registered
 * — named, owned, and DATED — and the register itself is checked three ways:
 *
 *   • an entry past its `expires` date is RED. A gap nobody closed is a decision, not a default.
 *   • an entry whose violation NO LONGER REPRODUCES is RED. Waivers rot into permanent holes;
 *     this one deletes itself the moment its finding is cured, and the check goes fully enforcing.
 *   • any violation NOT in the register is RED immediately, with no grace at all.
 *
 * The count of open gaps is printed on every run and in the job summary. Silence is the failure
 * mode this whole file is about; the register is loud by construction.
 */
export function readKnownGaps(root) {
  const text = readIfPresent(root, KNOWN_GAPS_FILE);
  if (text === null) return { gaps: [] };
  return JSON.parse(text);
}

function gapKey(violation) {
  return `${violation.check}:${violation.id}`;
}

// ── the checks ────────────────────────────────────────────────────────────────────────────────

/**
 * Every check returns `{ examined, violations }`. `examined` is not decoration: it is the
 * non-vacuity evidence the runner asserts against `contract.minima`, so a check that stopped
 * seeing its inputs fails instead of passing.
 */

export function checkCalledPaths(root, contract, surface) {
  const byPath = indexSurface(surface);
  const violations = [];
  const sites = scanCallSites(root, contract);
  const prefix = surface.versionPrefix;

  for (const site of sites) {
    // A code path that already carries the version prefix would double it against a base that
    // includes one. Reported under check 2, where the convention lives.
    if (site.normalized.startsWith(`${prefix}/`)) continue;
    const published = `${prefix}${site.normalized}`;
    const methods = byPath.get(published);
    if (!methods) {
      violations.push({
        check: "called-path",
        id: `code ${site.method} ${published}`,
        detail: `${site.file}:${site.line} calls ${site.method} ${published}, which the published spec does not publish. Either the operation is not public (do not call it from a fork) or the platform must publish it.`,
      });
    } else if (!methods.has(site.method)) {
      violations.push({
        check: "called-path",
        id: `code ${site.method} ${published}`,
        detail:
          `${site.file}:${site.line} calls ${site.method} ${published}, but the published spec ` +
          `carries only ${[...methods].sort().join(", ")} for that path.`,
      });
    }
  }

  const refs = scanDocPathRefs(root, contract, surface);
  for (const ref of refs) {
    const methods = byPath.get(ref.published);
    if (!methods) {
      violations.push({
        check: "called-path",
        id: `docs ${ref.method ?? "ANY"} ${ref.published}`,
        detail: `${ref.file}:${ref.line} points a reader at \`${ref.path}\` (${ref.published}), which the published spec does not publish — an integrator following this document calls an operation that is not part of the public surface.`,
      });
    } else if (ref.method && !methods.has(ref.method)) {
      violations.push({
        check: "called-path",
        id: `docs ${ref.method} ${ref.published}`,
        detail:
          `${ref.file}:${ref.line} documents ${ref.method} ${ref.published}, but the published ` +
          `spec carries only ${[...methods].sort().join(", ")} for that path.`,
      });
    }
  }

  return {
    examined: {
      callSites: sites.length,
      docPathRefs: refs.length,
      publishedOps: surface.ops.length,
    },
    violations,
    census: { sites, refs },
  };
}

export function checkBaseUrlConvention(root, contract, surface) {
  const violations = [];
  const prefix = surface.versionPrefix;
  const doubled = `${prefix}${prefix}`;
  let examined = 0;

  // (a) THE SPEC SIDE. The convention only holds if the published server is origin-only and every
  //     published path carries the prefix. If the platform ever moves the prefix into `servers`,
  //     every base handed to an integrator silently doubles — and this reds first.
  examined += 1;
  if (surface.serverUrl.replace(/\/+$/, "").endsWith(prefix)) {
    violations.push({
      check: "base-url",
      id: "spec-server-carries-prefix",
      detail:
        `the published server URL ${surface.serverUrl} ends in ${prefix}; the kit's base-URL ` +
        `convention (base includes ${prefix}) would then double it.`,
    });
  }
  for (const op of surface.ops) {
    examined += 1;
    if (!op.path.startsWith(`${prefix}/`)) {
      violations.push({
        check: "base-url",
        id: `spec-path-missing-prefix ${op.method} ${op.path}`,
        detail: `published operation ${op.method} ${op.path} does not carry the ${prefix} prefix.`,
      });
    }
  }

  // (b) THE CODE SIDE. `apiBase()` already ends in the prefix, so a call site that spells it again
  //     produces `/v1/v1/…`.
  for (const site of scanCallSites(root, contract)) {
    examined += 1;
    if (site.normalized.startsWith(`${prefix}/`)) {
      violations.push({
        check: "base-url",
        id: `code-doubles-prefix ${site.file}:${site.line}`,
        detail:
          `${site.file}:${site.line} appends ${site.path} to ${contract.apiBase.accessor}(), which ` +
          `already ends in ${prefix} — the request would be built as ${doubled}${site.normalized.slice(prefix.length)}.`,
      });
    }
  }

  // (c) THE LITERAL SIDE. A doubled prefix anywhere in code or docs is a build failure, full stop.
  const literalTargets = [
    ...contract.docPathScanFiles,
    contract.docs.envExample,
    ...contract.callSiteGlobs.flatMap((dir) =>
      walk(join(root, dir))
        .filter((f) => SOURCE_EXTENSIONS.has(f.slice(f.lastIndexOf("."))))
        .map((f) => relative(root, f).split(sep).join("/")),
    ),
  ];
  for (const relPath of literalTargets) {
    const text = readIfPresent(root, relPath);
    if (text === null) continue;
    examined += 1;
    text.split("\n").forEach((line, idx) => {
      if (line.includes(doubled)) {
        violations.push({
          check: "base-url",
          id: `doubled-prefix-literal ${relPath}:${idx + 1}`,
          detail: `${relPath}:${idx + 1} contains a doubled version prefix (${doubled}).`,
        });
      }
    });
  }

  // (d) THE DOCUMENTED SIDE. Wherever the API base variable is named, the "includes the prefix"
  //     convention must be restated — that restatement is the only thing standing between an
  //     integrator and pasting a base that 404s every call. And any example URL given for it must
  //     actually end in the prefix, while a page-host base must never carry one.
  const conventionTargets = [contract.docs.envExample, ...contract.docPathScanFiles];
  const baseVars = [
    { name: contract.apiBase.envVar, includes: true },
    ...contract.pageHostBases.map((b) => ({ name: b.envVar, includes: false })),
  ];
  for (const relPath of conventionTargets) {
    const text = readIfPresent(root, relPath);
    if (text === null) continue;
    for (const spec of baseVars) {
      for (const win of documentationBlocks(text, spec.name)) {
        if (!win.owns) continue;
        examined += 1;
        if (!win.text.includes(prefix)) {
          violations.push({
            check: "base-url",
            id: `convention-unstated ${relPath}:${win.line} ${spec.name}`,
            detail:
              `${relPath}:${win.line} defines ${spec.name} without restating the ${prefix} ` +
              `convention (${spec.includes ? "the base INCLUDES it" : `an origin only — no ${prefix}`}).`,
          });
        }
        for (const clean of concreteUrls(win.text)) {
          if (clean.includes("docs.purplelabelmd.com")) continue; // the docs site, not a gateway
          const endsWithPrefix = clean.endsWith(prefix);
          if (spec.includes && !endsWithPrefix) {
            violations.push({
              check: "base-url",
              id: `example-missing-prefix ${relPath}:${win.line}`,
              detail: `${relPath}:${win.line} gives ${clean} as a ${spec.name} example, but it does not end in ${prefix}.`,
            });
          }
          if (!spec.includes && endsWithPrefix) {
            violations.push({
              check: "base-url",
              id: `example-has-prefix ${relPath}:${win.line}`,
              detail: `${relPath}:${win.line} gives ${clean} as a ${spec.name} example, but that base must be an origin only.`,
            });
          }
        }
      }
    }
  }

  return { examined: { conventionPoints: examined }, violations };
}

export function checkClaims(root, contract) {
  const violations = [];
  const readme = readIfPresent(root, contract.docs.readme) ?? "";
  const envExampleText = readIfPresent(root, contract.docs.envExample) ?? "";
  const envExample = parseEnvExample(envExampleText);
  const docTexts = {
    README: readme,
    "env-example": envExampleText,
    "agent-brief": readIfPresent(root, contract.docs.agentBrief) ?? "",
    skill: readIfPresent(root, contract.docs.skill) ?? "",
  };
  const declared = contract.env.map((e) => e.name);

  // (a) THE ENV TABLE, THREE WAYS. Contract ↔ `.env.example` ↔ every document that claims to
  //     document the variable. Six restatements of one truth is how the drift got in; this makes
  //     the restatements answerable to a single declaration.
  for (const name of envExample.keys()) {
    if (!declared.includes(name)) {
      violations.push({
        check: "claims",
        id: `env-undeclared ${name}`,
        detail: `${contract.docs.envExample} sets ${name}, which ${CONTRACT_FILE} does not declare.`,
      });
    }
  }
  for (const entry of contract.env) {
    if (!envExample.has(entry.name)) {
      violations.push({
        check: "claims",
        id: `env-missing-from-template ${entry.name}`,
        detail: `${CONTRACT_FILE} declares ${entry.name}, but ${contract.docs.envExample} never sets it.`,
      });
    }
    for (const doc of entry.documented) {
      const text = docTexts[doc];
      if (text === undefined) continue;
      if (!text.includes(entry.name)) {
        violations.push({
          check: "claims",
          id: `env-undocumented ${entry.name} in ${doc}`,
          detail: `${CONTRACT_FILE} says ${entry.name} is documented in ${doc}, but that document never names it.`,
        });
      }
    }
    // (b) WIRE EFFECTS. A variable the kit puts on the wire must say so where it is documented,
    //     AND the code must still do it. Both directions: a stale claim is as bad as a silent one.
    if (entry.wireEffect?.header) {
      const header = entry.wireEffect.header;
      const sent = contract.callSiteGlobs.some((dir) =>
        walk(join(root, dir))
          .filter((f) => SOURCE_EXTENSIONS.has(f.slice(f.lastIndexOf("."))))
          .some((f) => readFileSync(f, "utf8").includes(`"${header}"`)),
      );
      if (!sent) {
        violations.push({
          check: "claims",
          id: `wire-effect-not-sent ${entry.name}`,
          detail: `${CONTRACT_FILE} claims ${entry.name} rides as ${header}, but no call site sends that header.`,
        });
      }
      const documentedWithHeader = documentationBlocks(readme, entry.name).some((w) =>
        w.text.includes(header),
      );
      if (!documentedWithHeader) {
        violations.push({
          check: "claims",
          id: `wire-effect-undocumented ${entry.name}`,
          detail:
            `${contract.docs.readme} documents ${entry.name} without naming its wire effect ` +
            `(${header}) — a reader cannot tell that this value is asserted to the platform on every call.`,
        });
      }
    }
    // (c) DEFAULTS. A non-empty default in the template is a value a fork ships with until it is
    //     changed; the README must state the same default, or the two disagree about what a fresh
    //     clone actually sends.
    const templateDefault = envExample.get(entry.name);
    if (
      templateDefault &&
      entry.documented.includes("README") &&
      !readme.includes(templateDefault)
    ) {
      violations.push({
        check: "claims",
        id: `env-default-undocumented ${entry.name}`,
        detail:
          `${contract.docs.envExample} defaults ${entry.name} to \`${templateDefault}\`, a value ` +
          `${contract.docs.readme} never mentions.`,
      });
    }
  }

  // (d) THE RULED RECONCILING SENTENCES. Frozen wire/code vocabulary plus a public prose noun is a
  //     permanent two-name situation; the ruling is that the mapping is STATED, in one sentence,
  //     wherever the reader meets it. Asserted, not remembered.
  for (const claim of contract.claims) {
    if (claim.kind !== "reconciling-sentence") continue;
    for (const relPath of claim.files) {
      const text = readIfPresent(root, relPath);
      if (text === null) continue;
      const mentionsCode = claim.codeTokens.some((t) => text.includes(t));
      // README-first ruling for C3: the mapping sentence is required in the file that names the
      // code vocabulary. A file that never mentions it owes nothing.
      if (!mentionsCode) continue;
      if (!sentenceCarriesAll(text, [...claim.codeTokens, ...claim.publicTokens])) {
        violations.push({
          check: "claims",
          id: `${claim.id} ${relPath}`,
          detail:
            `${relPath} uses ${claim.codeTokens.join(" / ")} but carries no single sentence that ` +
            `also names ${claim.publicTokens.join(" / ")}. Ruling: ${claim.ruling}`,
        });
      }
    }
  }

  return {
    examined: {
      envVars: contract.env.length,
      envTemplateKeys: envExample.size,
      claims: contract.claims.length,
    },
    violations,
  };
}

// ── the runner ────────────────────────────────────────────────────────────────────────────────

export function runChecks({ root = REPO_ROOT, surface, contract = readContract(root) } = {}) {
  // A zero-operation surface is a broken INPUT, not a small one: every called-path lookup would
  // "correctly" fail and every convention loop would vacuously pass. Refuse at the boundary rather
  // than produce a verdict from nothing.
  if (!surface || !Array.isArray(surface.ops) || surface.ops.length === 0) {
    throw new Error("spec-contract was handed a surface with zero operations — refusing to rule");
  }
  const called = checkCalledPaths(root, contract, surface);
  const base = checkBaseUrlConvention(root, contract, surface);
  const claims = checkClaims(root, contract);

  const examined = { ...called.examined, ...base.examined, ...claims.examined };
  const violations = [...called.violations, ...base.violations, ...claims.violations];

  // NON-VACUITY. Checked before anything else is believed: a census under its floor means the
  // scanners lost sight of their inputs, and every "pass" above is then meaningless.
  const jams = [];
  for (const [key, floor] of Object.entries(contract.minima)) {
    const seen = examined[key];
    if (seen === undefined) {
      jams.push(`no census reported for '${key}' — the check that owns it did not run`);
    } else if (seen < floor) {
      jams.push(
        `${key}: examined ${seen}, floor ${floor} — the checker stopped seeing its inputs, so its silence is not evidence of correctness`,
      );
    }
  }

  // The register: unregistered violations are hard reds; registered ones are open gaps; and the
  // register must not rot (expired entries, and entries whose finding is already cured, both red).
  const register = readKnownGaps(root);
  const gaps = Array.isArray(register.gaps) ? register.gaps : [];
  const seenKeys = new Set(violations.map(gapKey));
  const registered = new Map(gaps.map((g) => [`${g.check}:${g.id}`, g]));
  const today = new Date().toISOString().slice(0, 10);

  const hard = [];
  const open = [];
  for (const violation of violations) {
    const entry = registered.get(gapKey(violation));
    if (!entry) hard.push(violation);
    else if (!entry.expires || entry.expires < today) {
      hard.push({
        ...violation,
        detail: `${violation.detail} [REGISTERED GAP EXPIRED ${entry.expires ?? "(no expiry)"} — owner: ${entry.owner ?? "unassigned"}]`,
      });
    } else open.push({ ...violation, entry });
  }
  const stale = gaps.filter((g) => !seenKeys.has(`${g.check}:${g.id}`));

  const ok = hard.length === 0 && stale.length === 0 && jams.length === 0;
  // FOUR VERDICTS, AND `CLEAN` IS NOT THE SAME AS `OPEN-GAPS`.
  //
  // This matters more than it looks. A consumer downstream of this instrument — the walk's
  // docs-current bar re-proves itself from this verdict rather than by hand — would otherwise read
  // exit 0 and conclude "the kit conforms to the published spec," while six registered findings are
  // still reproducing underneath. A green that masks known drift, promoted into a walk gate, is a
  // worse failure than the drift itself. So the register's grace is visible IN THE VERDICT, and a
  // caller has to opt into accepting it (`--allow-open-gaps`) rather than inherit it silently.
  const verdict =
    jams.length > 0 ? "JAMMED" : !ok ? "FAILED" : open.length > 0 ? "OPEN-GAPS" : "CLEAN";
  return {
    ok,
    verdict,
    hard,
    open,
    stale,
    jams,
    examined,
    violations,
    census: called.census,
    surface,
  };
}

/**
 * The machine-readable verdict. Prose is for humans; this is what a downstream gate reads, so it
 * carries the open-gap count explicitly — no consumer can accidentally treat "green with six
 * registered findings" as "clean".
 */
export function verdictRecord(result) {
  return {
    verdict: result.verdict,
    clean: result.verdict === "CLEAN",
    counts: {
      unregisteredViolations: result.hard.length,
      staleRegisterEntries: result.stale.length,
      openGaps: result.open.length,
      jams: result.jams.length,
    },
    openGaps: result.open.map((v) => ({
      check: v.check,
      id: v.id,
      owner: v.entry.owner ?? null,
      expires: v.entry.expires ?? null,
    })),
    examined: result.examined,
    surface: { source: result.surface.source, opCount: result.surface.opCount },
    checkedAt: new Date().toISOString(),
  };
}

export function formatReport(result) {
  const lines = [];
  const push = (s) => lines.push(s);
  push(
    `spec-contract — checked against ${result.surface.opCount} published operation(s) from ${result.surface.source}`,
  );
  push(
    `  census: ${result.examined.callSites} code call site(s) · ${result.examined.docPathRefs} documented platform path(s) · ` +
      `${result.examined.envVars} declared env var(s) · ${result.examined.claims} ruled claim(s)`,
  );
  if (result.jams.length > 0) {
    push("");
    push("JAMMED — this instrument did not actually rule. A jam is not a pass:");
    for (const jam of result.jams) push(`  ! ${jam}`);
  }
  if (result.hard.length > 0) {
    push("");
    push(`FAILED — ${result.hard.length} unregistered violation(s):`);
    for (const v of result.hard) push(`  x [${v.check}] ${v.detail}`);
  }
  if (result.stale.length > 0) {
    push("");
    push(
      `FAILED — ${result.stale.length} stale entr(ies) in ${KNOWN_GAPS_FILE} (the finding no longer reproduces — delete the entry so the check goes fully enforcing):`,
    );
    for (const g of result.stale) push(`  x [${g.check}] ${g.id} — ${g.note ?? ""}`);
  }
  if (result.open.length > 0) {
    push("");
    push(
      `OPEN GAPS — ${result.open.length} registered finding(s), owned elsewhere, still reproducing:`,
    );
    for (const v of result.open) {
      push(`  o [${v.check}] ${v.detail}`);
      push(
        `      owner: ${v.entry.owner ?? "unassigned"} · expires: ${v.entry.expires ?? "(none)"} · ${v.entry.note ?? ""}`,
      );
    }
  }
  push("");
  // One machine-greppable verdict line, always, in exactly one shape.
  push(
    `spec-contract verdict: ${result.verdict}${result.open.length > 0 ? ` (${result.open.length} registered open gap(s) — NOT clean)` : ""}`,
  );
  return lines.join("\n");
}

/**
 * The verdict goes on the job summary as well as into the log. A jam that only exists in step 9
 * of a collapsed log is a jam nobody reads — the whole point of this instrument is that its
 * silence cannot be mistaken for its approval.
 */
export function writeStepSummary(markdown) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return false;
  appendFileSync(file, `${markdown}\n`, "utf8");
  return true;
}

export function summaryFor(result) {
  if (result.jams.length > 0)
    return `### 🚨 spec-contract JAMMED\nThe instrument did not rule, so nothing below is evidence.\n\n${result.jams.map((j) => `- ${j}`).join("\n")}`;
  if (!result.ok)
    return `### ❌ spec-contract FAILED\n${result.hard.length} unregistered violation(s), ${result.stale.length} stale register entr(ies).\n\n${[...result.hard.map((v) => `- **${v.check}** — ${v.detail}`), ...result.stale.map((g) => `- **stale register entry** — \`${g.id}\` no longer reproduces; delete it`)].join("\n")}`;
  const gaps = result.open.length;
  const census = `Checked ${result.examined.callSites} call site(s) and ${result.examined.docPathRefs} documented platform path(s) against ${result.surface.opCount} published operation(s).`;
  if (gaps === 0) return `### ✅ spec-contract CLEAN\n${census}\n\nNo open gaps.`;
  return `### 🟡 spec-contract OPEN-GAPS — green, but **not clean**\n${census}\n\n**${gaps} registered finding(s) still reproducing** (owned elsewhere, expiring). A downstream gate must not read this as conformance:\n${result.open.map((v) => `- \`${v.id}\` — owner ${v.entry.owner}, expires ${v.entry.expires}`).join("\n")}`;
}

/**
 * EXIT CODES — and the default is STRICT on purpose.
 *
 *   0  CLEAN      nothing reproduces. The only verdict that means "this kit conforms."
 *   1  FAILED     an unregistered violation, or a stale/expired register entry.
 *   2  JAMMED     the instrument did not rule. Never a pass.
 *   3  OPEN-GAPS  no NEW drift, but registered findings are still reproducing.
 *
 * A caller that does nothing gets the strict answer, because the dangerous consumer is the one
 * that just runs the command and believes exit 0. Kit CI opts into the lenient form explicitly
 * with `--allow-open-gaps`; a downstream conformance gate must not.
 */
export const EXIT_CODES = { CLEAN: 0, FAILED: 1, JAMMED: 2, "OPEN-GAPS": 3 };

if (isEntrypoint(import.meta.url)) {
  const argv = process.argv.slice(2);
  const arg = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i === -1 ? fallback : argv[i + 1];
  };
  const root = arg("--root", REPO_ROOT);
  const surfaceFile = arg("--surface", SURFACE_PATH);
  const allowOpenGaps = argv.includes("--allow-open-gaps");
  const verdictOut = arg("--verdict-out", null);
  let result;
  try {
    const surface = JSON.parse(readFileSync(surfaceFile, "utf8"));
    if (!Array.isArray(surface.ops) || surface.ops.length === 0) {
      throw new Error(
        `surface ${surfaceFile} carries zero operations — refusing to check against it`,
      );
    }
    result = runChecks({ root, surface });
  } catch (err) {
    console.error(`spec-contract JAMMED: ${err.message}`);
    writeStepSummary(`### 🚨 spec-contract JAMMED\n${err.message}`);
    process.exit(EXIT_CODES.JAMMED);
  }
  console.log(formatReport(result));
  writeStepSummary(summaryFor(result));
  if (verdictOut)
    writeFileSync(verdictOut, `${JSON.stringify(verdictRecord(result), null, 2)}\n`, "utf8");
  const code = EXIT_CODES[result.verdict];
  if (code === EXIT_CODES["OPEN-GAPS"] && allowOpenGaps) {
    console.log(
      "  (--allow-open-gaps: accepting a NOT-CLEAN verdict. A conformance gate must run without this flag.)",
    );
    process.exit(EXIT_CODES.CLEAN);
  }
  process.exit(code);
}
