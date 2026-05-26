import type { Card, Unit, Tile, Faction } from "./types";
import { CARD_BY_ID } from "./cards";
import { MAP_W, MAP_H, isPassable } from "./map";

export interface BattleConfig {
  playerStartGold: number;
  enemyStartGold: number;
  playerDmgMult: number;
  enemyDmgMult: number;
  playerHpMult: number;
  enemyHpMult: number;
  aiSpawnInterval: number; // ticks between AI spawn pulses
  playerKillBounty: number;
  enemyKillBounty: number;
}

export const DEFAULT_CONFIG: BattleConfig = {
  playerStartGold: 500,
  enemyStartGold: 500,
  playerDmgMult: 1,
  enemyDmgMult: 1,
  playerHpMult: 1,
  enemyHpMult: 1,
  aiSpawnInterval: 4,
  playerKillBounty: 25,
  enemyKillBounty: 25,
};

export interface BattleState {
  map: Tile[][];
  units: Unit[];
  tick: number;
  playerGold: number;
  enemyGold: number;
  villagesPlayer: number;
  villagesEnemy: number;
  log: string[];
  winner: Faction | null;
  visibility: boolean[][]; // for player fog of war
  config: BattleConfig;
}

export function newBattle(map: Tile[][], config: BattleConfig = DEFAULT_CONFIG): BattleState {
  return {
    map,
    units: [],
    tick: 0,
    playerGold: config.playerStartGold,
    enemyGold: config.enemyStartGold,
    villagesPlayer: 0,
    villagesEnemy: 0,
    log: ["⚔️ Schiera le tue truppe nelle prime 4 colonne, poi inizia la battaglia."],
    winner: null,
    visibility: Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false)),
    config,
  };
}

export function tileAt(state: BattleState, x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return null;
  return state.map[y][x];
}

function unitAt(state: BattleState, x: number, y: number): Unit | undefined {
  return state.units.find((u) => Math.round(u.x) === x && Math.round(u.y) === y && u.hp > 0);
}

export function canPlace(state: BattleState, card: Card, x: number, y: number, faction: Faction): string | null {
  const tile = tileAt(state, x, y);
  if (!tile) return "Fuori mappa";
  if (faction === "player" && x >= 4) return "Schiera nelle prime 4 colonne";
  if (faction === "enemy" && x < MAP_W - 4) return "Zona nemica";
  const isVehicle = card.type === "vehicle";
  const isNaval = card.id === "vhc-nave" || card.id === "vhc-aereo";
  if (!isPassable(tile.biome, isVehicle, isNaval)) return `Non transitabile in ${tile.biome}`;
  if (unitAt(state, x, y)) return "Casella occupata";
  const cost = card.cost;
  if (faction === "player" && cost > state.playerGold) return "Monete insufficienti";
  return null;
}

export function placeUnit(state: BattleState, card: Card, x: number, y: number, faction: Faction): BattleState {
  const newState = { ...state, units: [...state.units] };
  const hpMult = faction === "player" ? state.config.playerHpMult : state.config.enemyHpMult;
  newState.units.push({
    uid: Math.random().toString(36).slice(2),
    cardId: card.id,
    faction,
    x,
    y,
    hp: Math.round(card.hp * hpMult),
    cooldown: 0,
  });
  if (faction === "player") newState.playerGold -= card.cost;
  else newState.enemyGold -= card.cost;
  return newState;
}

function maxHpFor(state: BattleState, unit: Unit): number {
  const mult = unit.faction === "player" ? state.config.playerHpMult : state.config.enemyHpMult;
  return Math.round(CARD_BY_ID(unit.cardId).hp * mult);
}
export { maxHpFor };

function dist(a: Unit, b: Unit) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function biomeBonus(card: Card, biome: string): { atk: number; def: number } {
  let atk = 1, def = 1;
  if (card.prefersBiome === biome) { atk *= 1.2; def *= 1.2; }
  if (card.ability === "ambush" && biome === "forest") atk *= 1.5;
  if (card.ability === "fortify" && biome === "mountain") def *= 1.5;
  if (biome === "desert") def *= 0.9; // exposed
  return { atk, def };
}

export function recomputeVisibility(state: BattleState) {
  const vis = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  // Player base columns always visible
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < 4; x++) vis[y][x] = true;
  for (const u of state.units) {
    if (u.faction !== "player" || u.hp <= 0) continue;
    const card = CARD_BY_ID(u.cardId);
    const r = card.ability === "scout" ? 5 : card.range + 2;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = Math.round(u.x) + dx, ny = Math.round(u.y) + dy;
        if (nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H && Math.max(Math.abs(dx), Math.abs(dy)) <= r) {
          vis[ny][nx] = true;
        }
      }
    }
  }
  state.visibility = vis;
}

export function step(stateIn: BattleState): BattleState {
  if (stateIn.winner) return stateIn;
  const state: BattleState = { ...stateIn, units: stateIn.units.map((u) => ({ ...u })), log: stateIn.log.slice(-30) };
  state.tick += 1;

  // Village income every 5 ticks
  if (state.tick % 5 === 0) {
    state.villagesPlayer = 0;
    state.villagesEnemy = 0;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const t = state.map[y][x];
        if (!t.village) continue;
        const occ = state.units.find((u) => Math.round(u.x) === x && Math.round(u.y) === y && u.hp > 0);
        if (occ) {
          if (occ.faction === "player") { state.playerGold += 10; state.villagesPlayer += 1; }
          else { state.enemyGold += 10; state.villagesEnemy += 1; }
        }
      }
    }
  }

  // Each unit acts
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    u.cooldown = Math.max(0, u.cooldown - 1);
    const card = CARD_BY_ID(u.cardId);
    // find nearest enemy
    const enemies = state.units.filter((e) => e.faction !== u.faction && e.hp > 0);
    if (enemies.length === 0) continue;
    enemies.sort((a, b) => dist(u, a) - dist(u, b));
    const target = enemies[0];
    const d = dist(u, target);
    if (d <= card.range && u.cooldown === 0) {
      // attack
      const atkCard = card;
      const defCard = CARD_BY_ID(target.cardId);
      const atkTile = state.map[Math.round(u.y)][Math.round(u.x)];
      const defTile = state.map[Math.round(target.y)][Math.round(target.x)];
      const ab = biomeBonus(atkCard, atkTile.biome);
      const db = biomeBonus(defCard, defTile.biome);
      // Rally bonus
      let rally = 1;
      const allies = state.units.filter((a) => a.faction === u.faction && a.hp > 0 && a.uid !== u.uid);
      if (allies.some((a) => CARD_BY_ID(a.cardId).ability === "rally" && dist(a, u) <= 2)) rally = 1.25;
      const dmgMult = u.faction === "player" ? state.config.playerDmgMult : state.config.enemyDmgMult;
      const dmg = Math.max(1, Math.round((atkCard.attack * ab.atk * rally * dmgMult) - defCard.defense * db.def * 0.5));
      target.hp -= dmg;
      u.cooldown = 2;
      if (target.hp <= 0) {
        const bounty = u.faction === "player" ? state.config.playerKillBounty : state.config.enemyKillBounty;
        if (u.faction === "player") state.playerGold += bounty;
        else state.enemyGold += bounty;
        state.log.push(
          `💥 ${atkCard.name} (${u.faction === "player" ? "TU" : "AI"}) elimina ${defCard.name} (+${bounty}💰)`,
        );
      }
    } else {
      // move toward target
      const dx = Math.sign(target.x - u.x);
      const dy = Math.sign(target.y - u.y);
      const isVehicle = card.type === "vehicle";
      const isNaval = card.id === "vhc-nave" || card.id === "vhc-aereo";
      const tryMove = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) return false;
        const t = state.map[ny][nx];
        if (!isPassable(t.biome, isVehicle, isNaval)) return false;
        if (state.units.some((o) => o.hp > 0 && o.uid !== u.uid && Math.round(o.x) === nx && Math.round(o.y) === ny)) return false;
        u.x = nx; u.y = ny;
        return true;
      };
      const stepSize = card.speed >= 1.5 ? 2 : 1;
      for (let s = 0; s < stepSize; s++) {
        if (dx !== 0 && tryMove(Math.round(u.x) + dx, Math.round(u.y))) continue;
        if (dy !== 0 && tryMove(Math.round(u.x), Math.round(u.y) + dy)) continue;
        break;
      }
    }
  }

  state.units = state.units.filter((u) => u.hp > 0);
  recomputeVisibility(state);

  // Win conditions: no enemy units after some ticks AND no gold to spawn
  const playerAlive = state.units.some((u) => u.faction === "player");
  const enemyAlive = state.units.some((u) => u.faction === "enemy");
  if (state.tick > 8) {
    if (!playerAlive && state.playerGold < 40) state.winner = "enemy";
    else if (!enemyAlive && state.enemyGold < 40) state.winner = "player";
  }

  return state;
}

// AI: simple — spawn affordable units randomly in its zone
export function aiSpawn(state: BattleState, deck: Card[]): BattleState {
  if (state.winner) return state;
  let s = state;
  const affordable = deck.filter((c) => c.cost <= s.enemyGold).sort((a, b) => b.score - a.score);
  // Spawn up to 2 per call
  for (let i = 0; i < 2; i++) {
    const choice = affordable[Math.floor(Math.random() * Math.min(3, affordable.length))];
    if (!choice) break;
    // try random valid placement in enemy zone
    for (let attempt = 0; attempt < 20; attempt++) {
      const x = MAP_W - 1 - Math.floor(Math.random() * 4);
      const y = Math.floor(Math.random() * MAP_H);
      const err = canPlace(s, choice, x, y, "enemy");
      if (!err) {
        s = placeUnit(s, choice, x, y, "enemy");
        s.log = [...s.log.slice(-30), `🟥 Nemico schiera ${choice.name}`];
        break;
      }
    }
  }
  return s;
}
