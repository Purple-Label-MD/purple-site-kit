"use client";

import type { SupplyTerm } from "@/lib/catalog/types";
import { useState } from "react";

/**
 * Supply-term selector (WI-042 · Scope 5). The term ladder is the MERCHANDISING
 * surface, not a post-click reveal — so it renders DEFAULT-EXPANDED and driven by
 * config (terms/prices as data; the ship-vs-bill split is carried per term). Prices
 * are placeholder SLOTS; cadence notes align the commercial rhythm to the protocol.
 */
export function SupplyTermSelector({ terms }: { terms: SupplyTerm[] }) {
  const [selected, setSelected] = useState(terms[0]?.id);
  const current = terms.find((t) => t.id === selected) ?? terms[0];
  return (
    <div className="supply-selector" aria-label="Supply term">
      <div className="eyebrow">Supply term</div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="visually-hidden">Choose a supply term</legend>
        <div className="grid grid--3" style={{ marginTop: 8 }}>
          {terms.map((t) => (
            <label
              key={t.id}
              className="card"
              data-selected={t.id === current?.id ? "true" : undefined}
              style={{ cursor: "pointer", display: "block" }}
            >
              <input
                type="radio"
                name="supply-term"
                value={t.id}
                checked={t.id === current?.id}
                onChange={() => setSelected(t.id)}
                style={{ marginRight: 8 }}
              />
              <strong>{t.label}</strong>
              <div style={{ fontWeight: 700 }}>{t.priceSlot}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {t.cadenceNote}
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
