export type CardType = "leader" | "soldier" | "vehicle";
export type Biome = "plain" | "desert" | "forest" | "mountain" | "sea" | "village";
export type Faction = "player" | "enemy";

export type AbilityKey =
  | "rally" // +dmg to allies in radius
  | "scout" // reveals larger area
  | "fortify" // +def
  | "ambush" // first strike bonus in forest
  | "blitz" // +speed
  | "bombard"; // ranged attack

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number; // tiles per tick
  range: number; // attack range in tiles
  ability?: AbilityKey;
  abilityDesc?: string;
  score: number;
  description: string;
  emoji: string;
  prefersBiome?: Biome;
}

export interface Unit {
  uid: string;
  cardId: string;
  faction: Faction;
  x: number;
  y: number;
  hp: number;
  cooldown: number;
}

export interface Tile {
  biome: Biome;
  village?: boolean; // grants gold per tick
}
