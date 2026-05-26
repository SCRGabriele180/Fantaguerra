// Persistent player progression: wins, upgrade points, AI difficulty.

export interface Progression {
  wins: number;
  losses: number;
  points: number; // earned 1 per win, spent on upgrades
  upgradeGold: number; // levels in starting-gold upgrade
  upgradeDamage: number; // levels in damage upgrade
  upgradeHp: number; // levels in HP upgrade
}

const KEY = "fantaguerra:progression";

const DEFAULT: Progression = {
  wins: 0,
  losses: 0,
  points: 0,
  upgradeGold: 0,
  upgradeDamage: 0,
  upgradeHp: 0,
};

export function loadProgression(): Progression {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProgression(p: Progression) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

// === Upgrade definitions ===
export const UPGRADES = {
  gold: { name: "Tesoreria", desc: "+50 monete iniziali per livello", cost: 1, max: 10, icon: "💰" },
  damage: { name: "Artiglieria", desc: "+5% danno per livello", cost: 1, max: 10, icon: "⚔️" },
  hp: { name: "Corazza", desc: "+5% HP unità per livello", cost: 1, max: 10, icon: "🛡️" },
} as const;

// === Derived player bonuses ===
export function playerStartingGold(p: Progression) {
  return 500 + p.upgradeGold * 50;
}
export function playerDamageMult(p: Progression) {
  return 1 + p.upgradeDamage * 0.05;
}
export function playerHpMult(p: Progression) {
  return 1 + p.upgradeHp * 0.05;
}

// === AI scaling (gets stronger every win) ===
// Linear-ish ramp, capped so it remains beatable.
export function aiStartingGold(p: Progression) {
  return 500 + Math.min(p.wins, 12) * 60;
}
export function aiDamageMult(p: Progression) {
  return 1 + Math.min(p.wins, 12) * 0.05;
}
export function aiHpMult(p: Progression) {
  return 1 + Math.min(p.wins, 12) * 0.04;
}
// Lower = more frequent spawns. Default 4, min 2.
export function aiSpawnInterval(p: Progression) {
  return Math.max(2, 4 - Math.floor(p.wins / 3));
}
// Both player and AI earn this much gold per enemy killed.
// AI scaling: more wins → AI kills give it more income, snowballing pressure.
export function playerKillBounty() {
  return 25;
}
export function aiKillBounty(p: Progression) {
  return 25 + Math.min(p.wins, 12) * 3;
}
export function aiDifficultyLabel(p: Progression) {
  const w = p.wins;
  if (w === 0) return "Recluta";
  if (w < 2) return "Veterano";
  if (w < 5) return "Élite";
  if (w < 9) return "Comandante";
  if (w < 13) return "Generale";
  return "Leggenda";
}

export function recordWin(): Progression {
  const p = loadProgression();
  p.wins += 1;
  p.points += 1;
  saveProgression(p);
  return p;
}
export function recordLoss(): Progression {
  const p = loadProgression();
  p.losses += 1;
  saveProgression(p);
  return p;
}

export function purchaseUpgrade(key: keyof typeof UPGRADES): Progression {
  const p = loadProgression();
  const def = UPGRADES[key];
  const current = key === "gold" ? p.upgradeGold : key === "damage" ? p.upgradeDamage : p.upgradeHp;
  if (current >= def.max || p.points < def.cost) return p;
  p.points -= def.cost;
  if (key === "gold") p.upgradeGold += 1;
  else if (key === "damage") p.upgradeDamage += 1;
  else p.upgradeHp += 1;
  saveProgression(p);
  return p;
}

export function resetProgression(): Progression {
  saveProgression({ ...DEFAULT });
  return { ...DEFAULT };
}
