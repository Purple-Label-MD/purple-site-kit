/**
 * The RED-FIRST proof for the spec-contract instrument.
 *
 * A check that has only ever been green proves nothing — it is indistinguishable from a check
 * that reads nothing. So every rule here is driven in BOTH directions on every CI run: a planted
 * violation must fire it, and the shipped tree must not.
 *
 * The fixtures are made by COPYING THE REAL TREE and mutating one thing. Nothing here is a
 * hand-written miniature of the kit: a fixture written to match the checker is a mirror, not a
 * test, and it agrees with the checker's bugs. `the unmutated copy verdicts identically to the
 * shipped tree` is the machine comparison that keeps the copy honest.
 */
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { HEARTBEAT, checkHeartbeat } from "./spec-contract-heartbeat.mjs";
import { VERDICT, diffSurfaces, probeLive } from "./spec-contract-live.mjs";
import { EXIT_CODES, readContract, runChecks, verdictRecord } from "./spec-contract.mjs";
import { REPO_ROOT, deriveSurface, serializeSurface } from "./spec-surface.mjs";

const SURFACE = JSON.parse(readFileSync(join(REPO_ROOT, "spec", "published-surface.json"), "utf8"));
const SKILL = ".claude/skills/site-kit-quickstart/SKILL.md";
const scratch = [];

after(() => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

/** A byte-faithful copy of the shipped tree. Mutations are applied to the copy, never to the kit. */
function fixture(mutate = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "spec-contract-fixture-"));
  scratch.push(dir);
  cpSync(REPO_ROOT, dir, {
    recursive: true,
    filter: (src) => !/(^|\/)(node_modules|\.next|\.git|out)(\/|$)/.test(src),
  });
  const edit = (relPath, fn) => {
    const file = join(dir, relPath);
    writeFileSync(file, fn(readFileSync(file, "utf8")), "utf8");
  };
  const writeJson = (relPath, value) =>
    writeFileSync(join(dir, relPath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
  mutate({ dir, edit, writeJson });
  return dir;
}

const check = (root, surface = SURFACE) => runChecks({ root, surface });
const ids = (violations) => violations.map((v) => `${v.check}:${v.id}`);
const hasHard = (result, check, fragment) =>
  result.hard.some((v) => v.check === check && `${v.id} ${v.detail}`.includes(fragment));

describe("spec-contract — the shipped tree (the GREEN direction)", () => {
  it("passes, and says out loud how much it examined", () => {
    const result = check(REPO_ROOT);
    assert.equal(result.hard.length, 0, `unregistered violations: ${ids(result.hard).join(", ")}`);
    assert.equal(result.stale.length, 0, `stale register entries: ${ids(result.stale).join(", ")}`);
    assert.deepEqual(result.jams, []);
    assert.ok(result.ok);
    assert.ok(result.examined.callSites >= 8);
    assert.ok(result.examined.docPathRefs >= 2);
    assert.ok(result.examined.publishedOps >= 30);
  });

  it("the unmutated copy verdicts identically to the shipped tree (the fixture is not a miniature)", () => {
    const live = check(REPO_ROOT);
    const copy = check(fixture());
    assert.deepEqual(ids(copy.violations).sort(), ids(live.violations).sort());
    assert.equal(copy.ok, live.ok);
  });
});

describe("check 1 — called-path existence (RED-first)", () => {
  it("RED: a code call to a path the published spec does not publish", () => {
    const root = fixture(({ edit }) =>
      edit("lib/purple/client.ts", (t) =>
        t.replace(
          "${apiBase()}/webhooks/event-types",
          "${apiBase()}/tenants/definitely-not-published",
        ),
      ),
    );
    const result = check(root);
    assert.ok(!result.ok);
    assert.ok(
      hasHard(result, "called-path", "/v1/tenants/definitely-not-published"),
      `expected the dead path to fire; got ${ids(result.hard).join(", ")}`,
    );
  });

  it("RED: a code call whose METHOD is not published for an otherwise real path", () => {
    const root = fixture(({ edit }) =>
      edit("lib/purple/client.ts", (t) =>
        t.replace(
          'const res = await fetch(`${apiBase()}/webhooks/event-types`, {\n    method: "GET",',
          'const res = await fetch(`${apiBase()}/webhooks/event-types`, {\n    method: "DELETE",',
        ),
      ),
    );
    const result = check(root);
    assert.ok(hasHard(result, "called-path", "carries only"), ids(result.hard).join(", "));
  });

  it("RED: a DOCUMENT that points a reader at an unpublished platform path", () => {
    const root = fixture(({ edit }) =>
      edit("README.md", (t) => `${t}\n\nCall \`GET /v1/not/a/published/op\` to do the thing.\n`),
    );
    const result = check(root);
    assert.ok(
      hasHard(result, "called-path", "/v1/not/a/published/op"),
      ids(result.hard).join(", "),
    );
  });

  it("GREEN-guard: the app's own routes are never mistaken for platform paths", () => {
    const root = fixture(({ edit }) =>
      edit(
        "README.md",
        (t) =>
          `${t}\n\nSee \`/legal/terms\`, \`/labs/packages\` and \`/api/purple/instrument/next\`.\n`,
      ),
    );
    assert.equal(check(root).hard.length, 0);
  });
});

describe("check 2 — base-URL convention (RED-first)", () => {
  it("RED: a call site that re-appends the version prefix the base already carries", () => {
    const root = fixture(({ edit }) =>
      edit("lib/purple/client.ts", (t) =>
        t.replace("${apiBase()}/instrument/resolve", "${apiBase()}/v1/instrument/resolve"),
      ),
    );
    const result = check(root);
    assert.ok(!result.ok);
    assert.ok(hasHard(result, "base-url", "code-doubles-prefix"), ids(result.hard).join(", "));
  });

  it("RED: a doubled version prefix written into a document", () => {
    const root = fixture(({ edit }) =>
      edit("README.md", (t) =>
        t.replace("## Going live", "## Going live\n\nBase: https://api.example.com/v1/v1\n"),
      ),
    );
    assert.ok(
      hasHard(check(root), "base-url", "doubled-prefix-literal"),
      "doubled literal must fire",
    );
  });

  it("RED: the variable is defined without restating the convention", () => {
    const root = fixture(({ edit }) =>
      edit(".env.example", (t) => `${t.replace(/#[^\n]*\/v1[^\n]*\n/g, "")}\n`),
    );
    assert.ok(
      hasHard(check(root), "base-url", "convention-unstated"),
      "an unstated convention must fire",
    );
  });

  it("RED: an API-base example that is missing the prefix, and a page-host example that has one", () => {
    const missing = fixture(({ edit }) =>
      edit(".env.example", (t) =>
        t.replace("https://api.<your-purple-gateway>/v1", "https://api.example.com"),
      ),
    );
    assert.ok(
      hasHard(check(missing), "base-url", "example-missing-prefix"),
      "a prefix-less API base example must fire",
    );

    const extra = fixture(({ edit }) =>
      edit(".env.example", (t) =>
        t.replace(
          "https://member.dev.purplelabelmd.com",
          "https://member.dev.purplelabelmd.com/v1",
        ),
      ),
    );
    assert.ok(
      hasHard(check(extra), "base-url", "example-has-prefix"),
      "a page host carrying the prefix must fire",
    );
  });

  it("RED: the SPEC side of the convention — a server URL that already carries the prefix", () => {
    const drifted = {
      ...SURFACE,
      serverUrl: `${SURFACE.serverUrl}${SURFACE.versionPrefix}`,
    };
    const result = runChecks({ root: REPO_ROOT, surface: drifted });
    assert.ok(
      hasHard(result, "base-url", "spec-server-carries-prefix"),
      ids(result.hard).join(", "),
    );
  });
});

describe("check 3 — claims as assertions (RED-first, and proven curable)", () => {
  it("RED: an env var in the template the contract does not declare", () => {
    const root = fixture(({ edit }) =>
      edit(".env.example", (t) => `${t}\nPURPLE_SURPRISE_VAR=1\n`),
    );
    assert.ok(hasHard(check(root), "claims", "env-undeclared PURPLE_SURPRISE_VAR"));
  });

  it("RED: a declared var the template never sets", () => {
    const root = fixture(({ edit }) =>
      edit(".env.example", (t) => t.replace(/^PURPLE_WEBHOOK_SECRET=.*$/m, "")),
    );
    assert.ok(hasHard(check(root), "claims", "env-missing-from-template PURPLE_WEBHOOK_SECRET"));
  });

  it("RED both ways: the wire effect must be SENT by the code and STATED in the README", () => {
    const notSent = fixture(({ edit }) =>
      edit("lib/purple/client.ts", (t) => t.replace('"X-Brand-Id": brandId(),', "")),
    );
    assert.ok(
      hasHard(check(notSent), "claims", "wire-effect-not-sent"),
      "code dropping the header must fire",
    );

    const notStated = fixture(({ edit }) =>
      edit("README.md", (t) => t.replace("rides as `X-Brand-Id`", "is a fork-local choice")),
    );
    assert.ok(
      hasHard(check(notStated), "claims", "wire-effect-undocumented"),
      "README dropping the header must fire",
    );
  });

  it("RED: a template default the README never states", () => {
    const root = fixture(({ edit }) =>
      edit(".env.example", (t) =>
        t.replace(
          "NEXT_PUBLIC_PURPLE_BRAND_ID=brd_demo_aurora",
          "NEXT_PUBLIC_PURPLE_BRAND_ID=brd_undocumented",
        ),
      ),
    );
    assert.ok(
      hasHard(check(root), "claims", "env-default-undocumented NEXT_PUBLIC_PURPLE_BRAND_ID"),
    );
  });

  it("C3 — the entry-mode mapping sentence is detected when it is ABSENT and when it is PRESENT", () => {
    // Absent today: the finding is registered, so it shows as an open gap rather than a hard red.
    const shipped = check(REPO_ROOT);
    assert.ok(
      shipped.open.some((v) => v.id.startsWith("C3-entry-mode-vocabulary")),
      "C3 must currently be an open registered gap",
    );

    // Cured: one sentence carrying both vocabularies clears it — and then the REGISTER entry goes
    // stale, which is itself a red. That is the self-retiring property, proven, not asserted.
    const cured = fixture(({ edit }) =>
      edit("README.md", (t) =>
        t.replace(
          "## Two archetypes, three demo brands",
          "The public entry-mode pair is question-first and pay-first; in this kit's frozen code they are the `funnelMode` values `quiz-first` and `buy-first` respectively.\n\n## Two archetypes, three demo brands",
        ),
      ),
    );
    const curedResult = check(cured);
    assert.ok(
      !curedResult.open.some((v) => v.id.startsWith("C3-entry-mode-vocabulary")),
      "the mapping sentence must satisfy C3",
    );
    assert.ok(
      curedResult.stale.some((g) => g.id.startsWith("C3-entry-mode-vocabulary")),
      "a cured finding must make its register entry STALE, so the waiver deletes itself",
    );
  });

  it("E1 — the journey_id / enrollment reconciliation is detected absent and present", () => {
    assert.ok(check(REPO_ROOT).open.some((v) => v.id.startsWith("E1-journey-id-noun")));

    const cured = fixture(({ edit }) =>
      edit(
        SKILL,
        (t) =>
          `${t}\n\nThe wire field \`journey_id\` is what public prose calls the enrollment id.\n`,
      ),
    );
    assert.ok(!check(cured).open.some((v) => v.id.startsWith("E1-journey-id-noun")));
  });

  it("a claim is satisfied only by ONE sentence, never by two unrelated paragraphs", () => {
    const split = fixture(({ edit }) =>
      edit(
        SKILL,
        (t) => `${t}\n\nThe wire carries \`journey_id\`.\n\nWe call it an enrollment elsewhere.\n`,
      ),
    );
    assert.ok(
      split.length > 0 && check(split).open.some((v) => v.id.startsWith("E1-journey-id-noun")),
      "two separate sentences must NOT satisfy a reconciling-sentence claim",
    );
  });
});

describe("the register — loud, expiring, and self-retiring", () => {
  it("RED: a violation that is not registered at all", () => {
    const root = fixture(({ edit }) =>
      edit("lib/purple/client.ts", (t) =>
        t.replace("${apiBase()}/webhooks/event-types", "${apiBase()}/nope"),
      ),
    );
    assert.ok(check(root).hard.length > 0, "an unregistered violation gets no grace");
  });

  it("RED: an EXPIRED register entry stops excusing its finding", () => {
    const root = fixture(({ dir, writeJson }) => {
      const register = JSON.parse(readFileSync(join(dir, "known-gaps.json"), "utf8"));
      register.gaps = register.gaps.map((g) => ({ ...g, expires: "2000-01-01" }));
      writeJson("known-gaps.json", register);
    });
    const result = check(root);
    assert.ok(result.hard.length > 0);
    assert.ok(result.hard.every((v) => v.detail.includes("REGISTERED GAP EXPIRED")));
  });

  it("RED: a STALE entry whose finding no longer reproduces", () => {
    const root = fixture(({ dir, writeJson }) => {
      const register = JSON.parse(readFileSync(join(dir, "known-gaps.json"), "utf8"));
      register.gaps.push({
        check: "called-path",
        id: "code GET /v1/long-since-cured",
        owner: "nobody",
        expires: "2099-01-01",
      });
      writeJson("known-gaps.json", register);
    });
    const result = check(root);
    assert.ok(!result.ok);
    assert.ok(result.stale.some((g) => g.id === "code GET /v1/long-since-cured"));
  });

  it("a green with open gaps is NOT reported as CLEAN — the verdict a downstream gate reads", () => {
    const shipped = check(REPO_ROOT);
    assert.ok(shipped.ok, "the shipped tree must not be failing");
    assert.ok(shipped.open.length > 0, "this assertion is only meaningful while gaps are open");
    assert.equal(shipped.verdict, "OPEN-GAPS");
    assert.notEqual(shipped.verdict, "CLEAN");

    const record = verdictRecord(shipped);
    assert.equal(record.clean, false, "a conformance consumer must not read this as clean");
    assert.equal(record.counts.openGaps, shipped.open.length);
    assert.equal(
      EXIT_CODES[shipped.verdict],
      3,
      "OPEN-GAPS must not share an exit code with CLEAN",
    );
    for (const gap of record.openGaps) {
      assert.ok(gap.owner, `verdict record gap ${gap.id} carries no owner`);
      assert.ok(gap.expires, `verdict record gap ${gap.id} carries no expiry`);
    }
  });

  it("CLEAN is reachable, and only when the register is empty AND nothing reproduces", () => {
    // Cure every registered finding at once, then empty the register. This is the state the kit
    // reaches once the six rows are closed — and it is the ONLY state that verdicts CLEAN.
    const root = fixture(({ edit, writeJson }) => {
      edit("lib/purple/client.ts", (t) =>
        t.replace(/\$\{apiBase\(\)\}\/tenants\/self/, "${apiBase()}/webhooks/event-types"),
      );
      edit(SKILL, (t) =>
        t
          .replace(
            "`/catalog`, `/brands/{brand_id}/offerings`, and",
            "the account-scoped configuration surface and",
          )
          .concat(
            "\n\nThe wire field `journey_id` is what public prose calls the enrollment id.\n",
          ),
      );
      edit("README.md", (t) =>
        t.replace(
          "## Two archetypes, three demo brands",
          "The public entry-mode pair is question-first and pay-first; in this kit's frozen code they are the `funnelMode` values `quiz-first` and `buy-first` respectively. The default offering ref is `offering_launch_starter`.\n\n## Two archetypes, three demo brands",
        ),
      );
      writeJson("known-gaps.json", { gaps: [] });
    });
    const result = check(root);
    assert.deepEqual(result.hard, [], result.hard.map((v) => v.detail).join(" | "));
    assert.deepEqual(result.stale, []);
    assert.equal(result.verdict, "CLEAN");
    assert.equal(EXIT_CODES[result.verdict], 0);
    assert.equal(verdictRecord(result).clean, true);
  });

  it("every open gap is reported with an owner and an expiry", () => {
    for (const gap of check(REPO_ROOT).open) {
      assert.ok(gap.entry.owner, `gap ${gap.id} has no owner`);
      assert.match(gap.entry.expires ?? "", /^\d{4}-\d{2}-\d{2}$/, `gap ${gap.id} has no expiry`);
    }
  });
});

describe("JAM — a checker that examines nothing must never read as a pass", () => {
  it("a census below its floor is JAMMED, not OK", () => {
    const root = fixture(({ dir, writeJson }) => {
      const contract = JSON.parse(readFileSync(join(dir, "integration-contract.json"), "utf8"));
      contract.callSiteGlobs = ["public"]; // a directory with no call sites at all
      writeJson("integration-contract.json", contract);
    });
    const result = check(root);
    assert.ok(!result.ok);
    assert.ok(
      result.jams.some((j) => j.includes("callSites")),
      result.jams.join("; "),
    );
  });

  it("a surface with no operations is refused rather than trivially satisfied", () => {
    assert.throws(
      () => runChecks({ root: REPO_ROOT, surface: { ...SURFACE, ops: [] } }),
      /zero/i,
      "an empty surface must not silently pass every called-path check",
    );
  });

  it("a missing census key is a jam, not an omission", () => {
    const root = fixture(({ dir, writeJson }) => {
      const contract = JSON.parse(readFileSync(join(dir, "integration-contract.json"), "utf8"));
      contract.minima.somethingNobodyMeasures = 1;
      writeJson("integration-contract.json", contract);
    });
    assert.ok(check(root).jams.some((j) => j.includes("somethingNobodyMeasures")));
  });
});

describe("check 4 — live drift, with fetch failure kept DISTINCT", () => {
  // Rebuilt from the PIN, not hand-written, and grouped by path so a multi-method path keeps every
  // one of its methods — the collapse that a naive `Object.fromEntries` introduces would quietly
  // shrink the fixture and make a drift test pass for the wrong reason.
  const liveSpec = (overrides = {}) => {
    const paths = {};
    for (const op of SURFACE.ops) {
      paths[op.path] ??= {};
      paths[op.path][op.method.toLowerCase()] = { responses: { 200: { description: "ok" } } };
    }
    return JSON.stringify({
      openapi: "3.1.0",
      info: { title: "Purple API", version: "0.0.0" },
      servers: [{ url: SURFACE.serverUrl }],
      paths,
      ...overrides,
    });
  };

  it("OK when live matches the pin and the checks pass against live", async () => {
    const probe = await probeLive({
      root: REPO_ROOT,
      fetchImpl: async () => ({ status: 200, text: async () => liveSpec() }),
    });
    assert.equal(probe.verdict, VERDICT.OK, JSON.stringify(probe.diff ?? probe.detail));
  });

  it("SURFACE-DRIFT when the live site publishes a different operation set", async () => {
    const withExtra = JSON.parse(liveSpec());
    withExtra.paths["/v1/brand-new-op"] = { get: { responses: { 200: { description: "ok" } } } };
    const probe = await probeLive({
      root: REPO_ROOT,
      fetchImpl: async () => ({ status: 200, text: async () => JSON.stringify(withExtra) }),
    });
    assert.equal(probe.verdict, VERDICT.DRIFT);
    assert.deepEqual(probe.diff.added, ["GET /v1/brand-new-op"]);
  });

  it("SURFACE-DRIFT when an operation the pin claims disappears from live", async () => {
    const shrunk = JSON.parse(liveSpec());
    // Rebuilt without the key rather than assigned `undefined`: the latter only disappears because
    // JSON.stringify happens to drop undefined values, which is a coincidence, not the intent.
    shrunk.paths = Object.fromEntries(
      Object.entries(shrunk.paths).filter(([p]) => p !== "/v1/webhooks/event-types"),
    );
    const probe = await probeLive({
      root: REPO_ROOT,
      fetchImpl: async () => ({ status: 200, text: async () => JSON.stringify(shrunk) }),
    });
    assert.equal(probe.verdict, VERDICT.DRIFT);
    assert.ok(probe.diff.removed.includes("GET /v1/webhooks/event-types"));
  });

  it("LIVE-FETCH-FAILED is its own verdict — never reported as drift, never as a pass", async () => {
    const probe = await probeLive({
      root: REPO_ROOT,
      attempts: 2,
      delayMs: 0,
      fetchImpl: async () => {
        throw new Error("ECONNREFUSED");
      },
    });
    assert.equal(probe.verdict, VERDICT.FETCH_FAILED);
    assert.notEqual(probe.verdict, VERDICT.DRIFT);
    assert.match(probe.detail, /UNPROVEN/);
  });

  it("a non-200 from the docs site is a fetch failure, not silence", async () => {
    const probe = await probeLive({
      root: REPO_ROOT,
      attempts: 1,
      delayMs: 0,
      fetchImpl: async () => ({ status: 503, text: async () => "" }),
    });
    assert.equal(probe.verdict, VERDICT.FETCH_FAILED);
    assert.match(probe.detail, /503/);
  });

  it("a transient blip followed by a good read is NOT drift", async () => {
    let call = 0;
    const probe = await probeLive({
      root: REPO_ROOT,
      attempts: 3,
      delayMs: 0,
      fetchImpl: async () => {
        call += 1;
        if (call === 1) throw new Error("transient");
        return { status: 200, text: async () => liveSpec() };
      },
    });
    assert.equal(probe.verdict, VERDICT.OK);
  });

  it("a live spec whose server already carries the prefix is DRIFT, not a pass", async () => {
    const doubled = JSON.parse(liveSpec());
    doubled.servers = [{ url: `${SURFACE.serverUrl}/v1` }];
    const probe = await probeLive({
      root: REPO_ROOT,
      attempts: 1,
      delayMs: 0,
      fetchImpl: async () => ({ status: 200, text: async () => JSON.stringify(doubled) }),
    });
    assert.equal(probe.verdict, VERDICT.DRIFT);
    assert.match(probe.detail, /double/i);
  });

  it("the pinned surface is a faithful derivation of a real published spec", () => {
    const round = deriveSurface(liveSpec(), { source: SURFACE.source });
    assert.deepEqual(diffSurfaces(SURFACE, round), {
      serverChanged: false,
      prefixChanged: false,
      added: [],
      removed: [],
    });
    assert.equal(typeof serializeSurface(SURFACE), "string");
  });
});

describe("the jam detector — a gate that stopped ruling is not a gate that passed", () => {
  const contract = readContract(REPO_ROOT);
  const at = (iso) => new Date(iso);

  it("OK when a live verification succeeded inside the freshness window", async () => {
    const result = await checkHeartbeat({
      contract,
      now: at("2026-09-01T12:00:00Z"),
      listRuns: async () => [{ conclusion: "success", updated_at: "2026-09-01T06:00:00Z" }],
    });
    assert.equal(result.verdict, HEARTBEAT.OK);
  });

  it("JAMMED when the last success is older than the window — the guarantee lapsed quietly", async () => {
    const result = await checkHeartbeat({
      contract,
      now: at("2026-09-30T12:00:00Z"),
      listRuns: async () => [{ conclusion: "success", updated_at: "2026-09-01T06:00:00Z" }],
    });
    assert.equal(result.verdict, HEARTBEAT.JAMMED);
    assert.match(result.detail, /freshness window/);
  });

  it("JAMMED when every recent run FAILED — red-for-days is exactly the jam we are hunting", async () => {
    const result = await checkHeartbeat({
      contract,
      now: at("2026-09-30T12:00:00Z"),
      listRuns: async () => [
        { conclusion: "failure", updated_at: "2026-09-30T06:00:00Z" },
        { conclusion: "failure", updated_at: "2026-09-29T06:00:00Z" },
      ],
    });
    assert.equal(result.verdict, HEARTBEAT.JAMMED);
  });

  it("BOOTSTRAP is a dated grace, and it expires into a jam", async () => {
    const inside = await checkHeartbeat({
      contract,
      now: at("2026-09-01T00:00:00Z"),
      listRuns: async () => [],
    });
    assert.equal(inside.verdict, HEARTBEAT.BOOTSTRAP);
    const after = await checkHeartbeat({
      contract,
      now: at("2026-11-01T00:00:00Z"),
      listRuns: async () => [],
    });
    assert.equal(after.verdict, HEARTBEAT.JAMMED);
  });

  it("the bootstrap grace does NOT cover a workflow that runs and fails, even inside its window", async () => {
    const insideWindowButFailing = await checkHeartbeat({
      contract,
      now: at("2026-09-01T00:00:00Z"), // comfortably inside liveVerificationBootstrapUntil
      listRuns: async () => [{ conclusion: "failure", updated_at: "2026-08-31T23:00:00Z" }],
    });
    assert.equal(
      insideWindowButFailing.verdict,
      HEARTBEAT.JAMMED,
      "a red-and-staying-red pipe is the exact jam this detector exists for; the bootstrap date must not excuse it",
    );
    assert.match(insideWindowButFailing.detail, /NEVER succeeded/);
  });

  it("JAMMED in CI without credentials — a detector that cannot read is never a graceful skip", async () => {
    const result = await checkHeartbeat({
      contract,
      inCi: true,
      token: undefined,
      repository: undefined,
    });
    assert.equal(result.verdict, HEARTBEAT.JAMMED);
  });

  it("JAMMED when the API itself refuses", async () => {
    const result = await checkHeartbeat({
      contract,
      listRuns: async () => {
        throw new Error("HTTP 403");
      },
    });
    assert.equal(result.verdict, HEARTBEAT.JAMMED);
  });

  it("JAMMED when the contract declares no freshness window at all", async () => {
    const result = await checkHeartbeat({
      contract: { ...contract, liveVerificationFreshnessHours: undefined },
      listRuns: async () => [{ conclusion: "success", updated_at: new Date().toISOString() }],
    });
    assert.equal(result.verdict, HEARTBEAT.JAMMED);
  });
});
