import { useEffect, useState } from "react";
import { getPublikStatus, provisionPublik, type PublikStatus } from "@/lib/publik";

export function PublikCard() {
  const [status, setStatus] = useState<PublikStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const s = await getPublikStatus();
    setStatus(s);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!status) return null;

  async function handleEnable() {
    setLoading(true);
    await provisionPublik();
    await refresh();
    setLoading(false);
  }

  if (status.provider === "own") {
    return (
      <div className="mx-3 my-2 p-2.5 rounded-lg bg-bg-panel border border-border text-[11px] text-text-muted">
        <span className="font-medium text-text-secondary">AI Provider:</span> Custom API Key
      </div>
    );
  }

  if (status.provider === "needs_consent") {
    return (
      <div className="mx-3 my-2 p-3 rounded-lg bg-bg-panel border border-accent/30 space-y-2">
        <div className="text-xs font-semibold text-text-primary">Enable AI Patient Simulation</div>
        <p className="text-[11px] text-text-muted leading-relaxed">{status.disclosure}</p>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-1.5 px-3 bg-accent hover:bg-accent-hover text-white rounded text-xs font-medium transition-colors"
        >
          {loading ? "Setting up..." : "Enable with publik API"}
        </button>
      </div>
    );
  }

  const claimUrl = status.claim_url;
  const isAnonymous = !status.credential || status.credential.claim_state === "anonymous";
  const targetUrl = isAnonymous ? claimUrl : (status.add_credit_url || claimUrl);
  const buttonLabel = isAnonymous ? "Sign in with publik" : "Add a plan or pack";

  return (
    <div className="mx-3 my-2 p-3 rounded-lg bg-bg-panel border border-border space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-text-primary">publik API</span>
        <span className="text-[11px] text-accent font-semibold">{status.balance_line || "$0.00"}</span>
      </div>
      {status.cost_sentence && (
        <p className="text-[11px] text-text-muted leading-tight">{status.cost_sentence}</p>
      )}
      {targetUrl && (
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-1.5 px-3 text-center bg-bg-secondary hover:bg-border border border-border text-text-primary rounded text-xs font-medium transition-colors"
        >
          {buttonLabel}
        </a>
      )}
    </div>
  );
}
