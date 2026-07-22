#!/usr/bin/env node
/**
 * INTAKE-SKIN-01 browser parity suite (WI-043 · spec §7). Boots the built app in
 * credential-free mock mode and drives real Chromium to verify the states that need
 * a browser (the deterministic logic is unit-tested in scripts/intake-logic.test.mjs):
 *
 *   T1  click → highlight → auto-advance (single-select, no Continue click)
 *   T4  completion node: progress bar 100% + Back hidden
 *   T5  prefers-reduced-motion ⇒ advance is instant (< 250ms)
 *   AUDIT  settled computed-style: selected card border = accent, interior
 *          rgb(255,255,255), unselected cards hairline (not the accent)
 *
 * Run against the aurora build (EXPECT_ACCENT #6D28D9, BRAND-01 default, MODE=full)
 * and again against the peer build (its intake accent, MODE=audit) — the two runs
 * together are the two-brand retheme proof (same code, tokens-only divergence).
 *
 * Config via env: PARITY_PORT, EXPECT_ACCENT (hex), PARITY_MODE=full|audit.
 */

import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = process.env.PARITY_PORT || "3130";
const BASE = `http://localhost:${PORT}`;
const EXPECT_ACCENT = (process.env.EXPECT_ACCENT || "#6D28D9").toLowerCase();
const MODE = process.env.PARITY_MODE || "full";

// Disable CSS slide/transition so Playwright's actionability (element-stable) checks
// don't race the 240ms node slide. This is presentation-only: the JS confirm dwell
// (a setTimeout) is UNAFFECTED, so T1/T5 still exercise the real advance timing.
const NO_ANIM =
  "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;}";

async function openStart(browser, contextOpts) {
  // A tall viewport keeps the answer cards clear of the fixed footer pill so real
  // clicks land on the cards (not the overlay), without needing force.
  const page = await (
    await browser.newContext({ viewport: { width: 900, height: 1400 }, ...contextOpts })
  ).newPage();
  await page.goto(`${BASE}/start`);
  await page.addStyleTag({ content: NO_ANIM });
  await page.waitForSelector(".pl-card, .pl-continue", { timeout: 15_000 });
  return page;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const oks = [];
function check(name, cond, detail = "") {
  (cond ? oks : fails).push(`${name}${detail ? ` — ${detail}` : ""}`);
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

async function waitReady(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(BASE, { cache: "no-store" })).ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

/** Current node's headline text (or "" before hydration). */
function headline(page) {
  return page.evaluate(() => document.querySelector(".pl-headline")?.textContent ?? "");
}

/** Classify the current node by its DOM so the driver can answer it generically. */
function nodeKind(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll(".pl-card")];
    if (cards.length) return cards[0].getAttribute("role"); // radio | checkbox
    if (document.querySelector("input[type=number]")) return "number";
    if (document.querySelector("textarea")) return "text";
    if (document.querySelector("input[type=email]")) return "email";
    if (document.querySelector("input[type=file]")) return "file";
    if (document.querySelector('input[type="text"]')) return "address";
    if (document.querySelector(".pl-continue")) return "display";
    return "unknown";
  });
}

async function waitNodeChange(page, prev, timeout = 4000) {
  await page.waitForFunction(
    (p) => {
      const h = document.querySelector(".pl-headline")?.textContent ?? "";
      return h !== p;
    },
    prev,
    { timeout },
  );
}

async function isComplete(page) {
  return (await headline(page)).includes("Intake complete");
}

/** Answer the current node generically; returns after the node has advanced. */
async function answerNode(page) {
  const prev = await headline(page);
  const kind = await nodeKind(page);
  switch (kind) {
    case "radio":
      await page.locator(".pl-card").first().click(); // auto-advances after dwell
      break;
    case "checkbox":
      await page.locator(".pl-card").first().click();
      await page.locator(".pl-continue").click();
      break;
    case "number":
      await page.locator("input[type=number]").nth(0).fill("1");
      await page.locator("input[type=number]").nth(1).fill("2");
      await page.locator(".pl-continue").click();
      break;
    case "email":
      await page.locator("input[type=email]").fill("sample@example.com");
      await page.locator(".pl-continue").click();
      break;
    case "address":
      await page.locator('input[type="text"]').fill("123 Sample St");
      await page.locator(".pl-suggest button").first().click();
      await page.locator(".pl-continue").click();
      break;
    case "text":
    case "file":
    case "display":
      await page.locator(".pl-continue").click();
      break;
    default:
      throw new Error(`unknown node kind at "${prev}"`);
  }
  await waitNodeChange(page, prev);
}

async function main() {
  console.log(`parity: starting next on ${BASE} (mode=${MODE}, expect=${EXPECT_ACCENT}) …`);
  const server = spawn("npx", ["next", "start", "-p", PORT], {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  let browser;
  try {
    if (!(await waitReady())) throw new Error("server not ready");
    browser = await chromium.launch();

    // ── AUDIT + T1 (default motion) ──────────────────────────────────────────
    {
      const page = await openStart(browser);

      // Drive to the first multi-select node for the settled-state audit.
      let guard = 0;
      while (!(await isComplete(page)) && (await nodeKind(page)) !== "checkbox") {
        if ((await nodeKind(page)) === "radio") {
          // T1: single-select click → auto-advance with NO Continue click.
          const prev = await headline(page);
          await page.locator(".pl-card").first().click();
          await waitNodeChange(page, prev);
          check("T1 click→auto-advance", true);
        } else {
          await answerNode(page);
        }
        if (++guard > 20) throw new Error("drive guard tripped before a multi node");
      }

      if ((await nodeKind(page)) === "checkbox") {
        await page.locator(".pl-card").first().click(); // select → aria-checked
        await page.waitForSelector('.pl-card[aria-checked="true"]');
        const styles = await page.evaluate(() => {
          const sel = document.querySelector('.pl-card[aria-checked="true"]');
          const unsel = document.querySelector('.pl-card[aria-checked="false"]');
          const cs = (el) => (el ? getComputedStyle(el) : null);
          const s = cs(sel);
          const u = cs(unsel);
          return {
            selBorder: s?.borderTopColor,
            selBg: s?.backgroundColor,
            selBorderWidth: s?.borderTopWidth,
            unselBorder: u?.borderTopColor,
            unselBorderWidth: u?.borderTopWidth,
          };
        });
        const expectRgb = hexToRgb(EXPECT_ACCENT);
        check(
          "AUDIT selected border = accent",
          styles.selBorder === expectRgb,
          `${styles.selBorder} vs ${expectRgb}`,
        );
        check("AUDIT selected interior white", styles.selBg === "rgb(255, 255, 255)", styles.selBg);
        check("AUDIT selected border 2px", styles.selBorderWidth === "2px", styles.selBorderWidth);
        check(
          "AUDIT unselected border hairline (not accent)",
          styles.unselBorder !== expectRgb && styles.unselBorderWidth === "1px",
          `${styles.unselBorder} @ ${styles.unselBorderWidth}`,
        );

        // T3 (on the intake surface): the exclusive option clears siblings — nag-free.
        // The first card is selected (above); clicking the exclusive (last) must flip it.
        // Direct dispatch: the last card sits under the fixed footer pill, so a real
        // pointer click is intercepted — pointer hit-testing is already covered by T1.
        await page
          .locator(".pl-card")
          .last()
          .evaluate((el) => el.click());
        const t3 = await page.evaluate(() => {
          const cards = [...document.querySelectorAll(".pl-card")];
          return {
            first: cards[0]?.getAttribute("aria-checked"),
            last: cards[cards.length - 1]?.getAttribute("aria-checked"),
            err: /cannot be combined|please uncheck|\berror\b/i.test(document.body.innerText),
          };
        });
        check(
          "T3 exclusive clears siblings (DOM)",
          t3.first === "false" && t3.last === "true",
          `first=${t3.first} last=${t3.last}`,
        );
        check("T3 no error copy on exclusive select", !t3.err);
      }
      await page.close();
    }

    if (MODE === "full") {
      // ── T3b: degraded path (flagless node) — server 422 resolves SILENTLY ──────
      // The legacy node carries no client `exclusive` flag, so selecting a sibling +
      // the exclusive option submits a conflict; the renderer must silently collapse
      // to most-recent and auto-resubmit once, advancing with NO error copy (Δ1).
      {
        const page = await openStart(browser);
        let guard = 0;
        while (
          !(await isComplete(page)) &&
          !(await headline(page)).toLowerCase().includes("legacy")
        ) {
          await answerNode(page);
          if (++guard > 20) throw new Error("did not reach the legacy degraded node");
        }
        check(
          "T3b reached the degraded node",
          (await headline(page)).toLowerCase().includes("legacy"),
        );
        await page
          .locator(".pl-card")
          .first()
          .evaluate((el) => el.click()); // sibling
        await page
          .locator(".pl-card")
          .last()
          .evaluate((el) => el.click()); // exclusive (no flag; under footer)
        const prev = await headline(page);
        await page.locator(".pl-continue").click(); // conflict → 422 → silent resolve → advance
        let advanced = true;
        try {
          await waitNodeChange(page, prev, 4000);
        } catch {
          advanced = false;
        }
        const err = await page.evaluate(() =>
          /cannot be combined|please uncheck|\berror\b/i.test(document.body.innerText),
        );
        check("T3b degraded 422 resolves silently (advanced)", advanced);
        check("T3b no nag on the degraded path", !err);
        await page.close();
      }
    }

    if (MODE === "full") {
      // ── T5: reduced-motion advance is instant (< 250ms) ─────────────────────
      {
        const page = await openStart(browser, { reducedMotion: "reduce" });
        // advance to the first single-select (past the intro display)
        while ((await nodeKind(page)) !== "radio" && !(await isComplete(page))) {
          await answerNode(page);
        }
        const prev = await headline(page);
        const t0 = Date.now();
        await page.locator(".pl-card").first().click();
        await waitNodeChange(page, prev, 2000);
        const dt = Date.now() - t0;
        check("T5 reduced-motion advance < 250ms", dt < 250, `${dt}ms`);
        await page.context().close();
      }

      // ── T4: completion node — bar 100% + Back hidden ────────────────────────
      {
        const page = await openStart(browser);
        let guard = 0;
        while (!(await isComplete(page))) {
          await answerNode(page);
          if (++guard > 25) throw new Error("did not reach completion");
        }
        const state = await page.evaluate(() => {
          const bar = document.querySelector(".pl-bar > i");
          const back = document.querySelector(".pl-back");
          return {
            barWidth: bar ? bar.style.width : null,
            backDisabled: back ? back.disabled : true,
          };
        });
        check("T4 completion bar 100%", state.barWidth === "100%", String(state.barWidth));
        check("T4 Back hidden at completion", state.backDisabled === true);
        await page.close();
      }
    }
  } catch (e) {
    fails.push(`harness error — ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
    await sleep(400);
    if (!server.killed) server.kill("SIGKILL");
  }

  for (const o of oks) console.log(`  ✓ ${o}`);
  if (fails.length) {
    console.error(`\n✗ parity: ${fails.length} failure(s):`);
    for (const f of fails) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(`\n✓ parity (${MODE}): all checks passed.`);
}

main();
