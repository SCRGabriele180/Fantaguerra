import type { Biome, Tile } from "./types";

export const MAP_W = 16;
export const MAP_H = 10;

// Deterministic-ish seeded random
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function generateMap(seed = Date.now() % 1000000): Tile[][] {
  const rnd = rng(seed);
  // Start with plains
  const map: Tile[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => ({ biome: "plain" as Biome })),
  );

  // Coastline on the right: irregular sea band, 1-4 tiles deep
  for (let y = 0; y < MAP_H; y++) {
    const depth = 1 + Math.floor(rnd() * 4);
    for (let d = 0; d < depth; d++) {
      const x = MAP_W - 1 - d;
      if (rnd() < 0.85) map[y][x] = { biome: "sea" };
    }
  }

  // Paint organic biome blobs using random walks
  const paintBlob = (biome: Biome, size: number, avoidEdges = false) => {
    let cx = 3 + Math.floor(rnd() * (MAP_W - 8));
    let cy = Math.floor(rnd() * MAP_H);
    for (let i = 0; i < size; i++) {
      if (cx >= 0 && cy >= 0 && cx < MAP_W && cy < MAP_H) {
        const t = map[cy][cx];
        if (t.biome !== "sea" && !(avoidEdges && (cx < 2 || cx > MAP_W - 4))) {
          map[cy][cx] = { biome };
        }
      }
      // wander
      const dir = Math.floor(rnd() * 4);
      if (dir === 0) cx += 1;
      else if (dir === 1) cx -= 1;
      else if (dir === 2) cy += 1;
      else cy -= 1;
    }
  };

  // 2-3 forests, 2 mountain ridges, 1-2 deserts
  for (let i = 0; i < 2 + Math.floor(rnd() * 2); i++) paintBlob("forest", 10 + Math.floor(rnd() * 8));
  for (let i = 0; i < 2; i++) paintBlob("mountain", 7 + Math.floor(rnd() * 6), true);
  for (let i = 0; i < 1 + Math.floor(rnd() * 2); i++) paintBlob("desert", 9 + Math.floor(rnd() * 7));

  // Villages: place 5-6 on traversable land, spread out
  const placed: Array<[number, number]> = [];
  let attempts = 0;
  while (placed.length < 6 && attempts < 200) {
    attempts++;
    const x = 2 + Math.floor(rnd() * (MAP_W - 5));
    const y = Math.floor(rnd() * MAP_H);
    const t = map[y][x];
    if (t.biome === "sea") continue;
    if (placed.some(([px, py]) => Math.max(Math.abs(px - x), Math.abs(py - y)) < 3)) continue;
    map[y][x] = { biome: "village", village: true };
    placed.push([x, y]);
  }

  return map;
}

export function biomeColor(b: Biome): string {
  switch (b) {
    case "desert": return "var(--color-biome-desert)";
    case "forest": return "var(--color-biome-forest)";
    case "mountain": return "var(--color-biome-mountain)";
    case "sea": return "var(--color-biome-sea)";
    case "village": return "var(--color-biome-village)";
    default: return "var(--color-biome-plain)";
  }
}

export function biomeLabel(b: Biome): string {
  return { desert: "Deserto", forest: "Foresta", mountain: "Montagna", sea: "Mare", village: "Villaggio", plain: "Pianura" }[b];
}

export function biomeIcon(b: Biome): string {
  return { desert: "🌵", forest: "🌲", mountain: "⛰️", sea: "🌊", village: "🏘️", plain: "🌾" }[b];
}

export function isPassable(b: Biome, isVehicle: boolean, isNaval: boolean): boolean {
  if (b === "sea") return isNaval; // only naval/air
  if (b === "mountain" && isVehicle) return false;
  return true;
}
