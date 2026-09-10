#!/usr/bin/env node
/**
 * spec-surface — derive the PUBLISHED OPERATION SURFACE from a Purple public OpenAPI
 * document, and pin it.
 *
 * WHY A DERIVED SURFACE AND NOT THE WHOLE SPEC. The docs pipeline already byte-compares the
 * whole served spec against its own fresh projection (`docs-live-drift`) — that is the docs
 * lane's contract with itself. What the KIT consumes is narrower and far more stable: the set
 * of published operations (method + path), the server origin, and the version prefix. Pinning
 * the derived surface means a prose edit on the docs site does not red the kit, while any
 * change to what the kit is allowed to call does.
 *
 * The surface is the ONLY thing the kit's spec-anchored checks read. It is regenerated from the
 * live published spec by `npm run spec:pin` and compared against the live spec on every
 * `spec-contract-live` run.
 *
 * Usage:
 *   node scripts/spec-surface.mjs --from-live            # fetch live, print the surface JSON
 *   node scripts/spec-surface.mjs --from-live --write    # ... and write spec/published-surface.json
 *   node scripts/spec-surface.mjs --in <spec.json>       # derive from a local spec document
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * True when THIS file is the entrypoint. `realpath` on both sides on purpose: node resolves the
 * entry path through symlinks (`/tmp` → `/private/tmp` on macOS) while `import.meta.url` does
 * not, and a naive string compare silently turns every CLI in this repo into a no-op.
 */
export function isEntrypoint(moduleUrl) {
  try {
    return realpathSync(process.argv[1] ?? "") === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
export const REPO_ROOT = join(HERE, "..");

/** The live published spec the Purple docs site serves. Public — no credentials. */
export const LIVE_SPEC_URL = "https://docs.purplelabelmd.com/openapi/public-openapi.json";
export const SURFACE_PATH = join(REPO_ROOT, "spec", "published-surface.json");

const METHODS = ["get", "put", "post", "delete", "patch", "options", "head", "trace"];

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Derive the surface. Fails LOUDLY rather than returning an empty/partial surface: a surface
 * with no operations, no server, or an ambiguous version prefix is not a "small" surface, it is
 * a broken read — and a broken read that returns cleanly is how a fail-closed check goes
 * vacuously green (the sync-holes ② lesson, restated for this instrument).
 */
export function deriveSurface(specText, { source = LIVE_SPEC_URL } = {}) {
  let spec;
  try {
    spec = JSON.parse(specText);
  } catch (err) {
    throw new Error(`published spec is not JSON: ${err.message}`);
  }
  const servers = Array.isArray(spec.servers) ? spec.servers : [];
  if (servers.length !== 1 || typeof servers[0]?.url !== "string" || servers[0].url === "") {
    throw new Error(
      `published spec must carry exactly one absolute server URL; got ${JSON.stringify(servers)}`,
    );
  }
  const serverUrl = servers[0].url.replace(/\/+$/, "");
  if (!/^https?:\/\//.test(serverUrl)) {
    throw new Error(`published spec server is not an absolute URL: ${serverUrl}`);
  }
  const paths = spec.paths && typeof spec.paths === "object" ? spec.paths : null;
  if (!paths) throw new Error("published spec carries no paths object");
  const pathKeys = Object.keys(paths);
  if (pathKeys.length === 0) throw new Error("published spec carries zero paths");

  // The version prefix is DERIVED, never assumed: every published path must share one leading
  // `/<segment>` for the base-URL convention to be well defined at all.
  const firstSegments = new Set(pathKeys.map((p) => `/${p.split("/")[1] ?? ""}`));
  if (firstSegments.size !== 1) {
    throw new Error(
      `published paths do not share a single version prefix: ${[...firstSegments].sort().join(", ")}`,
    );
  }
  const versionPrefix = [...firstSegments][0];
  if (!/^\/v\d+$/.test(versionPrefix)) {
    throw new Error(`derived version prefix is not a version segment: ${versionPrefix}`);
  }
  // The doubling wall, asserted on the SPEC side: the server must NOT already carry the prefix,
  // or `server + path` doubles it. This is the platform half of the base-URL convention.
  if (serverUrl.endsWith(versionPrefix)) {
    throw new Error(
      `published server URL ${serverUrl} already ends in the version prefix ${versionPrefix} — server + path would double it`,
    );
  }

  const ops = [];
  for (const path of pathKeys.sort()) {
    const item = paths[path];
    if (!item || typeof item !== "object") continue;
    for (const method of METHODS) {
      if (item[method]) ops.push({ method: method.toUpperCase(), path });
    }
  }
  if (ops.length === 0) throw new Error("published spec carries zero operations");

  return {
    source,
    specSha256: sha256(specText),
    serverUrl,
    versionPrefix,
    opCount: ops.length,
    ops,
  };
}

export async function fetchLiveSpec({ fetchImpl = globalThis.fetch, url = LIVE_SPEC_URL } = {}) {
  // Cache-busted like the docs pipeline's probe: the instrument must see the ORIGIN's bytes.
  const bust = `kit-spec-contract=${Date.now()}`;
  const busted = url.includes("?") ? `${url}&${bust}` : `${url}?${bust}`;
  const response = await fetchImpl(busted, { headers: { "cache-control": "no-cache" } });
  if (response.status !== 200) throw new Error(`HTTP ${response.status} from ${url}`);
  const text = await response.text();
  if (text.trim() === "") throw new Error(`empty body from ${url}`);
  return text;
}

export function loadPinnedSurface(file = SURFACE_PATH) {
  const surface = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(surface.ops) || surface.ops.length === 0) {
    throw new Error(
      `pinned surface ${file} carries zero operations — refusing to check against it`,
    );
  }
  return surface;
}

/** Stable, diff-friendly serialization — the pin is reviewed by humans in PRs. */
export function serializeSurface(surface) {
  return `${JSON.stringify(surface, null, 2)}\n`;
}

if (isEntrypoint(import.meta.url)) {
  const argv = process.argv.slice(2);
  const run = async () => {
    let text;
    let source = LIVE_SPEC_URL;
    const inIdx = argv.indexOf("--in");
    if (inIdx !== -1) {
      const file = argv[inIdx + 1];
      text = readFileSync(file, "utf8");
      source = file;
    } else {
      text = await fetchLiveSpec();
    }
    const surface = deriveSurface(text, { source });
    const out = serializeSurface(surface);
    if (argv.includes("--write")) {
      mkdirSync(dirname(SURFACE_PATH), { recursive: true });
      writeFileSync(SURFACE_PATH, out, "utf8");
      console.log(`wrote ${SURFACE_PATH} — ${surface.opCount} published operation(s)`);
    } else {
      process.stdout.write(out);
    }
  };
  run().catch((err) => {
    console.error(`spec-surface FAILED: ${err.message}`);
    process.exit(1);
  });
}
