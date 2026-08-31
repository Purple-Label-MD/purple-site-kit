#!/usr/bin/env node
import { readContract, writeStepSummary } from "./spec-contract.mjs";
/**
 * spec-contract-heartbeat — THE JAM DETECTOR.
 *
 * A fail-closed gate that goes red is doing its job. A fail-closed gate that STOPS RULING is a
 * silent lie: the guarantee it used to provide is gone and nothing says so. The platform's own
 * docs-projection sat red on main for days while publishing stayed frozen at its last-good
 * artifact, and the estate went right on believing "the docs cannot drift." Nobody was told.
 *
 * So this instrument is required to prove it is still ruling. `spec-contract-live` runs on kit
 * main and on a daily schedule; every PR-time run asks this question of the GitHub API:
 *
 *     when did a live verification last CONCLUDE SUCCESSFULLY on the default branch?
 *
 * Older than the freshness window (or never, past the bootstrap date) ⇒ JAMMED. Reported as
 * loudly as drift, and never as a pass — because "the drift check has not run in two weeks" and
 * "there is no drift" are different facts.
 *
 * A jam is deliberately reported with the SAME severity as a violation. The whole point is that
 * the quiet failure and the loud one look the same from the outside.
 */
import { REPO_ROOT, isEntrypoint } from "./spec-surface.mjs";

export const LIVE_WORKFLOW_FILE = "spec-contract-live.yml";

export const HEARTBEAT = {
  OK: "OK",
  JAMMED: "JAMMED",
  BOOTSTRAP: "BOOTSTRAP",
  NOT_EVALUATED: "NOT-EVALUATED",
};

/**
 * @param now              injected clock (the tests own time, not the wall)
 * @param listRuns         () => Promise<{runs: {conclusion, updated_at}[]}> — injected so the
 *                         RED-first tests drive every branch without touching the network
 */
export async function checkHeartbeat({
  now = new Date(),
  contract = readContract(REPO_ROOT),
  listRuns,
  inCi = process.env.GITHUB_ACTIONS === "true" || process.env.CI === "true",
  token = process.env.GITHUB_TOKEN,
  repository = process.env.GITHUB_REPOSITORY,
} = {}) {
  const windowHours = contract.liveVerificationFreshnessHours;
  if (typeof windowHours !== "number" || windowHours <= 0) {
    return {
      verdict: HEARTBEAT.JAMMED,
      detail:
        "integration-contract.json declares no liveVerificationFreshnessHours — the freshness window is the check; without it there is nothing to assert.",
    };
  }

  if (!listRuns) {
    if (!inCi) {
      // Local runs legitimately cannot ask GitHub. Say so plainly rather than printing a pass.
      return {
        verdict: HEARTBEAT.NOT_EVALUATED,
        detail: "not running in CI — the jam check needs the workflow-run history.",
      };
    }
    if (!token || !repository) {
      // In CI this is NOT a graceful skip. A missing token means the jam detector itself has
      // jammed, which is the precise failure this file exists to refuse to hide.
      return {
        verdict: HEARTBEAT.JAMMED,
        detail:
          "running in CI without GITHUB_TOKEN/GITHUB_REPOSITORY — the jam detector cannot read the workflow history, so it cannot rule. A gate that cannot rule does not pass.",
      };
    }
    listRuns = defaultListRuns({ token, repository });
  }

  let runs;
  try {
    runs = await listRuns();
  } catch (err) {
    return {
      verdict: HEARTBEAT.JAMMED,
      detail: `could not read the workflow-run history: ${err.message}`,
    };
  }

  const successes = (runs ?? [])
    .filter((r) => r.conclusion === "success")
    .map((r) => new Date(r.updated_at ?? r.run_started_at ?? 0))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b - a);

  if (successes.length === 0) {
    const bootstrapUntil = contract.liveVerificationBootstrapUntil;
    // THE GRACE COVERS "NOT WIRED YET", NEVER "WIRED AND FAILING".
    //
    // The bootstrap window exists for the gap between this instrument landing and its first run on
    // main — a period when zero runs of any kind exist. The moment runs DO exist and none of them
    // succeeded, we are looking at the exact failure this file was written to catch: a pipe that is
    // red and staying red. Letting the bootstrap date excuse that would rebuild the silence.
    const everRan = (runs ?? []).length > 0;
    if (!everRan && bootstrapUntil && now.toISOString().slice(0, 10) <= bootstrapUntil) {
      return {
        verdict: HEARTBEAT.BOOTSTRAP,
        detail: `the live-drift workflow has never run; inside the bootstrap window (until ${bootstrapUntil}). This grace EXPIRES on that date, and it does NOT cover a workflow that runs and fails.`,
      };
    }
    return {
      verdict: HEARTBEAT.JAMMED,
      detail: everRan
        ? `${LIVE_WORKFLOW_FILE} has run ${runs.length} time(s) and NEVER succeeded — the live-drift guarantee has never actually held, and the bootstrap grace does not cover a failing pipe.`
        : `no ${LIVE_WORKFLOW_FILE} run exists${bootstrapUntil ? ` and the bootstrap window closed on ${bootstrapUntil}` : ""} — the live-drift guarantee has never actually held.`,
    };
  }

  const ageHours = (now.getTime() - successes[0].getTime()) / 3_600_000;
  if (ageHours > windowHours) {
    return {
      verdict: HEARTBEAT.JAMMED,
      ageHours,
      detail: `the last successful live verification was ${ageHours.toFixed(1)}h ago, past the ${windowHours}h freshness window. The pinned surface has not been checked against the live spec since then, so "no drift" is currently an assumption, not a finding.`,
    };
  }
  return {
    verdict: HEARTBEAT.OK,
    ageHours,
    detail: `last successful live verification ${ageHours.toFixed(1)}h ago (window ${windowHours}h).`,
  };
}

function defaultListRuns({ token, repository }) {
  return async () => {
    const url = `https://api.github.com/repos/${repository}/actions/workflows/${LIVE_WORKFLOW_FILE}/runs?branch=main&per_page=20`;
    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
      },
    });
    if (response.status === 404) return []; // workflow not registered yet — the bootstrap branch handles it
    if (response.status !== 200)
      throw new Error(`HTTP ${response.status} from the workflow-runs API`);
    const body = await response.json();
    return body.workflow_runs ?? [];
  };
}

if (isEntrypoint(import.meta.url)) {
  checkHeartbeat()
    .then((result) => {
      const jammed = result.verdict === HEARTBEAT.JAMMED;
      const line = `spec-contract heartbeat: ${result.verdict} — ${result.detail}`;
      if (jammed)
        console.error(`JAMMED — the drift guarantee is not currently held.\n  ! ${result.detail}`);
      else console.log(line);
      writeStepSummary(
        jammed
          ? `### 🚨 spec-contract-live has JAMMED\n${result.detail}\n\nThe kit's spec conformance is currently **unverified against the live spec**. That is not the same as "no drift".`
          : `### 🫀 live-verification heartbeat: ${result.verdict}\n${result.detail}`,
      );
      process.exit(jammed ? 1 : 0);
    })
    .catch((err) => {
      console.error(`spec-contract heartbeat JAMMED: ${err.stack ?? err.message}`);
      process.exit(1);
    });
}
