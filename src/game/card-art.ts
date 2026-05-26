// Maps card ids and biomes to imported art assets.
import iron from "@/assets/card-iron.jpg";
import falco from "@/assets/card-falco.jpg";
import fanteria from "@/assets/card-fanteria.jpg";
import ranger from "@/assets/card-ranger.jpg";
import alpino from "@/assets/card-alpino.jpg";
import genio from "@/assets/card-genio.jpg";
import tank from "@/assets/card-tank.jpg";
import jeep from "@/assets/card-jeep.jpg";
import aereo from "@/assets/card-aereo.jpg";
import nave from "@/assets/card-nave.jpg";

import tileDesert from "@/assets/tile-desert.jpg";
import tileForest from "@/assets/tile-forest.jpg";
import tileMountain from "@/assets/tile-mountain.jpg";
import tileSea from "@/assets/tile-sea.jpg";
import tilePlain from "@/assets/tile-plain.jpg";
import tileVillage from "@/assets/tile-village.jpg";

import type { Biome } from "./types";

export const CARD_ART: Record<string, string> = {
  "ldr-iron": iron,
  "ldr-falco": falco,
  "sld-fanteria": fanteria,
  "sld-ranger": ranger,
  "sld-alpino": alpino,
  "sld-genio": genio,
  "vhc-tank": tank,
  "vhc-jeep": jeep,
  "vhc-aereo": aereo,
  "vhc-nave": nave,
};

export const BIOME_ART: Record<Biome, string> = {
  desert: tileDesert,
  forest: tileForest,
  mountain: tileMountain,
  sea: tileSea,
  plain: tilePlain,
  village: tileVillage,
};
