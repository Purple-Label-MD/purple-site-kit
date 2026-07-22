/**
 * Labs gate (WI-042 · Scope 6). Labs ship MARKETING-COMPLETE but FULFILLMENT-STUBBED:
 * journey step 5 is reserved and the lab vendor lane (Junction, BAA-gated) is future.
 * So every labs "order" CTA is gated exactly like the checkout stub — the story sells
 * now, the lane wakes later. No payment, no order is placed.
 */
export function LabGate({ panelName }: { panelName?: string }) {
  return (
    <div className="counsel-banner" role="alert">
      🧪 LABS STUB — not wired. Lab ordering opens when the labs fulfillment lane (vendor + BAA)
      ships. {panelName ? `"${panelName}" is a marketing placeholder; ` : ""}no order is placed and
      no payment is taken.
    </div>
  );
}

/** A gated (non-functional) order button, visually consistent with live CTAs. */
export function LabOrderCta() {
  return (
    <button
      type="button"
      className="btn"
      disabled
      aria-disabled="true"
      title="Opens with the labs lane"
    >
      Order panel (opens with the labs lane)
    </button>
  );
}
