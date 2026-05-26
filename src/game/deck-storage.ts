import type { Card } from "@/game/types";

const KEY = "fantaguerra:deck";
const DEFAULT_DECK = ["ldr-iron", "sld-fanteria", "sld-ranger", "sld-alpino", "sld-genio", "vhc-tank", "vhc-jeep", "vhc-aereo"];

export function loadDeck(): string[] {
  if (typeof window === "undefined") return DEFAULT_DECK;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_DECK;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_DECK;
}

export function saveDeck(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export const DEFAULT_DECK_IDS = DEFAULT_DECK;

export function deckCards(all: Card[], ids: string[]): Card[] {
  return ids.map((id) => all.find((c) => c.id === id)).filter(Boolean) as Card[];
}
