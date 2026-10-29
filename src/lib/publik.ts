import { invoke } from "@tauri-apps/api/core";

export const APP_SLUG = "biocase";
export const APP_VERSION = "0.1.0";
export const DEFAULT_BASE_URL = "https://publikhq.com/api/v1";
export const MODELS = { fast: "publik-fast", balanced: "publik-balanced", smart: "publik-smart" } as const;

export const DISCLOSURE =
  "This app can use publik API for its AI features: no key to paste, priced per use in dollars from a publik balance that starts at $0.00. " +
  "Linking this computer to a publik account gives $0.05 of free use, once. Your prompts go through publik's servers to the model; you can switch to your own key at any time.";

export interface PublikCredential {
  key: string;
  base_url: string;
  install_id: string;
  claim_url: string | null;
  claim_state: "anonymous" | "claimed";
  add_credit_url: string | null;
  cost_sentence: string | null;
  balance_micros: number | null;
}

export interface PublikStatus {
  provider: "own" | "publik" | "needs_consent";
  base_url: string;
  has_key: boolean;
  credential?: PublikCredential | null;
  balance_line?: string;
  claim_url?: string | null;
  add_credit_url?: string | null;
  cost_sentence?: string | null;
  disclosure: string;
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
}

export async function getPublikStatus(): Promise<PublikStatus | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<PublikStatus>("publik_get_status", {
      userBaseUrl: null,
      userApiKey: import.meta.env.VITE_NIM_API_KEY || null,
    });
  } catch (err) {
    console.warn("Failed to get publik status:", err);
    return null;
  }
}

export async function provisionPublik(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    await invoke("publik_provision");
    return true;
  } catch (err) {
    console.error("Failed to provision publik:", err);
    return false;
  }
}
