const STORAGE_KEY = "voice_agent_api_keys";

export interface ApiKeys {
  deepgram: string;
  gemini: string;
  cartesia: string;
}

export function getApiKeys(): ApiKeys | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setApiKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function hasApiKeys(): boolean {
  const keys = getApiKeys();
  return !!(keys?.deepgram && keys?.gemini && keys?.cartesia);
}

export function clearApiKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}
