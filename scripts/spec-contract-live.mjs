#!/usr/bin/env node
/**
 * spec-contract-live — the kit's LIVE-DRIFT probe, mirroring the platform's `docs-live-drift`.
 *
 * The PR-time check runs against `spec/published-surface.json`, a PINNED snapshot: deterministic,
 * offline, and reviewable in a diff. That pin is only as true as the last time somebody looked at
 * the live site. This job is the looking: it fetches the spec the docs site actually serves,
 * compares the surface derived from it to the pin, and re-runs the spec-anchored checks against
 * LIVE rather than against the pin.
 *
 * THREE VERDICTS, NEVER CONFLATED — the lesson the docs pipeline already paid for:
 *   OK                — live matches the pin and the checks pass against live.
 *   SURFACE-DRIFT     — the site ANSWERED and publishes a different operation surface than the pin
 *                       claims. Re-pin (`npm run spec:pin`) and re-run the checks.
 *   LIVE-FETCH-FAILED — the live spec could not be read at all. Drift is UNPROVEN in either
 *                       direction. This is its own red, because "we could not check" and "we
 *                       checked and it is fine" are different facts and only one of them is a pass.
 *   CHECKS-FAILED     — live is reachable and matches, but the kit violates the live contract.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatReport,
  readContract,
  runChecks,
  summaryFor,
  writeStepSummary,
} from "./spec-contract.mjs";
import {
  LIVE_SPEC_URL,
  REPO_ROOT,
  SURFACE_PATH,
  deriveSurface,
  fetchLiveSpec,
  isEntrypoint,
} from "./spec-surface.mjs";

export const VERDICT = {
  OK: "OK",
  DRIFT: "SURFACE-DRIFT",
  FETCH_FAILED: "LIVE-FETCH-FAILED",
  CHECKS_FAILED: "CHECKS-FAILED",
};

const EXIT = { OK: 0, CHECKS_FAILED: 1, FETCH_FAILED: 2, DRIFT: 3 };

/** Stable identity of a surface for comparison: what is published, from where, under what prefix. */
export function surfaceIdentity(surface) {
  return JSON.stringify({
    serverUrl: surface.serverUrl,
    versionPrefix: surface.versionPrefix,
    ops: surface.ops.map((o) => `${o.method} ${o.path}`).sort(),
  });
}

export function diffSurfaces(pinned, live) {
  const key = (o) => `${o.method} ${o.path}`;
  const pinnedOps = new Set(pinned.ops.map(key));
  const liveOps = new Set(live.ops.map(key));
  return {
    serverChanged: pinned.serverUrl !== live.serverUrl,
    prefixChanged: pinned.versionPrefix !== live.versionPrefix,
    added: [...liveOps].filter((o) => !pinnedOps.has(o)).sort(),
    removed: [...pinnedOps].filter((o) => !liveOps.has(o)).sort(),
  };
}

/**
 * A transient network blip is not drift. Retry the FETCH; never retry the comparison. If any
 * attempt read a body, the surface question is answerable and we answer it; only a probe that
 * never got a body at all reports LIVE-FETCH-FAILED.
 */
export async function probeLive({
  root = REPO_ROOT,
  pinnedFile = SURFACE_PATH,
  liveUrl = LIVE_SPEC_URL,
  fetchImpl = globalThis.fetch,
  attempts = 3,
  delayMs = 10000,
  sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)),
} = {}) {
  const pinned = JSON.parse(readFileSync(pinnedFile, "utf8"));
  if (!Array.isArray(pinned.ops) || pinned.ops.length === 0) {
    return {
      verdict: VERDICT.FETCH_FAILED,
      detail: `pinned surface ${pinnedFile} carries zero operations`,
    };
  }

  let lastFailure = null;
  let liveText = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) await sleepImpl(delayMs);
    try {
      liveText = await fetchLiveSpec({ fetchImpl, url: liveUrl });
      break;
    } catch (err) {
      lastFailure = `attempt ${attempt}: ${err.message}`;
    }
  }
  if (liveText === null) {
    return {
      verdict: VERDICT.FETCH_FAILED,
      detail: `could not read the live published spec at ${liveUrl} — ${lastFailure ?? "no response"}. Drift is UNPROVEN in either direction; this is not a pass.`,
    };
  }

  let live;
  try {
    live = deriveSurface(liveText, { source: liveUrl });
  } catch (err) {
    // The site answered with something that is not a usable published spec. That is the live
    // artifact being broken, which is drift of the loudest kind — not a fetch failure.
    return {
      verdict: VERDICT.DRIFT,
      detail: `the live spec is unusable: ${err.message}`,
      live: null,
    };
  }

  if (surfaceIdentity(pinned) !== surfaceIdentity(live)) {
    return { verdict: VERDICT.DRIFT, diff: diffSurfaces(pinned, live), pinned, live };
  }

  const result = runChecks({ root, surface: live, contract: readContract(root) });
  return { verdict: result.ok ? VERDICT.OK : VERDICT.CHECKS_FAILED, result, live };
}

export function formatLiveReport(probe) {
  const lines = [`spec-contract-live verdict: ${probe.verdict}`];
  if (probe.verdict === VERDICT.FETCH_FAILED) {
    lines.push(`  ! ${probe.detail}`);
  } else if (probe.verdict === VERDICT.DRIFT) {
    if (probe.detail) lines.push(`  ! ${probe.detail}`);
    if (probe.diff) {
      const d = probe.diff;
      if (d.serverChanged)
        lines.push(
          `  ! server URL drifted: pinned ${probe.pinned.serverUrl} → live ${probe.live.serverUrl}`,
        );
      if (d.prefixChanged)
        lines.push(
          `  ! version prefix drifted: pinned ${probe.pinned.versionPrefix} → live ${probe.live.versionPrefix}`,
        );
      for (const op of d.added) lines.push(`  + live publishes ${op}, the pin does not`);
      for (const op of d.removed) lines.push(`  - the pin claims ${op}, live does not publish it`);
      lines.push(
        "  → re-pin with `npm run spec:pin` and re-run the checks against the new surface.",
      );
    }
  } else if (probe.result) {
    lines.push("");
    lines.push(formatReport(probe.result));
  }
  return lines.join("\n");
}

if (isEntrypoint(import.meta.url)) {
  const argv = process.argv.slice(2);
  const arg = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i === -1 ? fallback : argv[i + 1];
  };
  const root = arg("--root", REPO_ROOT);
  probeLive({ root, pinnedFile: arg("--surface", join(root, "spec", "published-surface.json")) })
    .then((probe) => {
      const report = formatLiveReport(probe);
      console.log(report);
      const headline = {
        [VERDICT.OK]: "### ✅ spec-contract-live OK",
        [VERDICT.DRIFT]:
          "### ❌ spec-contract-live SURFACE-DRIFT — the live spec publishes a different surface than the pin claims",
        [VERDICT.FETCH_FAILED]:
          "### 🚨 spec-contract-live LIVE-FETCH-FAILED — the live spec could not be read, so drift is UNPROVEN. This is not a pass.",
        [VERDICT.CHECKS_FAILED]: "### ❌ spec-contract-live CHECKS-FAILED against the live spec",
      }[probe.verdict];
      writeStepSummary(
        probe.result
          ? `${headline}\n\n${summaryFor(probe.result)}`
          : `${headline}\n\n\`\`\`\n${report}\n\`\`\``,
      );
      const code =
        probe.verdict === VERDICT.OK
          ? EXIT.OK
          : probe.verdict === VERDICT.DRIFT
            ? EXIT.DRIFT
            : probe.verdict === VERDICT.FETCH_FAILED
              ? EXIT.FETCH_FAILED
              : EXIT.CHECKS_FAILED;
      process.exit(code);
    })
    .catch((err) => {
      // An unexpected throw is a JAM: the probe did not rule, so nothing here is evidence.
      console.error(`spec-contract-live JAMMED: ${err.stack ?? err.message}`);
      writeStepSummary(
        `### 🚨 spec-contract-live JAMMED\nThe probe threw before ruling: ${err.message}`,
      );
      process.exit(EXIT.FETCH_FAILED);
    });
}
