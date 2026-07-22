// @ts-check
/**
 * Pure INTAKE-SKIN-01 interaction logic (WI-043).
 *
 * Extracted so the parity suite can unit-test the deterministic rules (T2 number-key
 * map, T3 structural exclusive both directions, T3b silent-422 degraded resolution,
 * multi gating) under CI's Node 20 with no browser — the copy-guard/catalog pattern.
 * The renderer imports these; the browser (Playwright) suite covers motion + styles.
 *
 * Exclusivity is a DATA flag (option.exclusive) — NEVER inferred from label text
 * (INT-A-07). When the flag is absent (live gateway predating INT-A-09), the renderer
 * allows free selection and the server's 422 drives the silent degraded resolution.
 */

/** Normalize a node's options to {code,label,sub?,exclusive?}, preferring the ratified shape. */
export function optionsOf(node) {
  if (Array.isArray(node?.options) && node.options.length) return node.options;
  return (node?.option_codes ?? []).map((code) => ({ code, label: humanize(code) }));
}

/** Placeholder humanizer — a live instrument supplies real labels via `options`. */
export function humanize(code) {
  return String(code).replace(/^opt_/, "").replace(/_/g, " ");
}

/** Codes flagged exclusive on this node (data only). */
export function exclusiveCodes(node) {
  return optionsOf(node)
    .filter((o) => o.exclusive)
    .map((o) => o.code);
}

/**
 * Apply a multi-select toggle with STRUCTURAL exclusive semantics (T3):
 * selecting an exclusive option clears all siblings; selecting any sibling clears the
 * exclusives — both directions, no error state. `selected` and the result are code arrays.
 */
export function toggleMulti(selected, node, code) {
  const cur = new Set(selected);
  const exclusives = new Set(exclusiveCodes(node));
  if (exclusives.has(code)) {
    // Selecting an exclusive option: it stands alone.
    if (cur.has(code)) cur.delete(code);
    else return [code];
  } else {
    // Selecting a sibling clears any exclusive, then toggles this code.
    for (const ex of exclusives) cur.delete(ex);
    if (cur.has(code)) cur.delete(code);
    else cur.add(code);
  }
  return [...cur];
}

/**
 * Silent degraded resolution for a server 422 exclusivity rejection when the client
 * had no `exclusive` flag (T3b): the MOST RECENT selection wins, conflicting
 * selections clear, and the caller auto-resubmits ONCE — no error banner, no copy.
 */
export function resolveExclusive422(lastToggledCode) {
  return lastToggledCode ? [lastToggledCode] : [];
}

/**
 * Multi-select Continue gating (visible, constraint-driven): enabled once the node's
 * min_selections is met. Absent min_selections ⇒ `required` is the min=1 proxy; a
 * not-required node enables at zero (silence can be a valid "none").
 */
export function isContinueEnabled(node, selectedCount) {
  const min = node?.min_selections ?? (node?.required ? 1 : 0);
  return selectedCount >= min;
}

/** Map a keydown key ("1".."9") to a zero-based option index, or -1 if not a select key. */
export function numberKeyIndex(key, optionCount) {
  const idx = Number.parseInt(key, 10) - 1;
  return Number.isInteger(idx) && idx >= 0 && idx < optionCount ? idx : -1;
}

/** Whether a control renders as tappable cards (single/multi select). */
export function isCardControl(control) {
  return control === "single_select" || control === "multi_select";
}
