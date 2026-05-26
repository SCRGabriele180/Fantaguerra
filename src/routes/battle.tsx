import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CARDS, CARD_BY_ID } from "@/game/cards";
import { generateMap, biomeColor, biomeIcon, biomeLabel, MAP_W, MAP_H } from "@/game/map";
import {
  newBattle,
  canPlace,
  placeUnit,
  step,
  aiSpawn,
  recomputeVisibility,
  maxHpFor,
  type BattleState,
  type BattleConfig,
} from "@/game/engine";
import { loadDeck, deckCards } from "@/game/deck-storage";
import {
  loadProgression,
  playerStartingGold,
  playerDamageMult,
  playerHpMult,
  aiStartingGold,
  aiDamageMult,
  aiHpMult,
  aiSpawnInterval,
  aiDifficultyLabel,
  playerKillBounty,
  aiKillBounty,
  recordWin,
  recordLoss,
} from "@/game/progression";
import { BIOME_ART } from "@/game/card-art";
import { CardView } from "@/components/game/CardView";
import type { Card } from "@/game/types";

export const Route = createFileRoute("/battle")({
  head: () => ({
    meta: [
      { title: "Battaglia · Fantaguerra" },
      { name: "description", content: "Schiera le truppe e conquista la mappa contro l'AI." },
    ],
  }),
  component: BattlePage,
});

type Phase = "deploy" | "battle" | "end";

function buildConfig(): BattleConfig {
  const p = loadProgression();
  return {
    playerStartGold: playerStartingGold(p),
    enemyStartGold: aiStartingGold(p),
    playerDmgMult: playerDamageMult(p),
    enemyDmgMult: aiDamageMult(p),
    playerHpMult: playerHpMult(p),
    enemyHpMult: aiHpMult(p),
    aiSpawnInterval: aiSpawnInterval(p),
    playerKillBounty: playerKillBounty(),
    enemyKillBounty: aiKillBounty(p),
  };
}

function BattlePage() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [progSnapshot, setProgSnapshot] = useState(() => loadProgression());
  const [state, setState] = useState<BattleState>(() => {
    const s = newBattle(generateMap(seed), buildConfig());
    recomputeVisibility(s);
    return s;
  });
  const [phase, setPhase] = useState<Phase>("deploy");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);
  const recordedRef = useRef(false);

  const deck = useMemo<Card[]>(() => deckCards(CARDS, loadDeck()), []);
  const aiDeck = useMemo<Card[]>(() => CARDS, []);

  const selected = selectedCardId ? deck.find((c) => c.id === selectedCardId) ?? null : null;

  // Battle tick loop
  useEffect(() => {
    if (phase !== "battle") return;
    const id = window.setInterval(() => {
      setState((prev) => {
        let s = step(prev);
        if (s.tick % s.config.aiSpawnInterval === 0) s = aiSpawn(s, aiDeck);
        if (s.winner) setPhase("end");
        return s;
      });
    }, 700);
    tickRef.current = id;
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [phase, aiDeck]);

  // Record result once
  useEffect(() => {
    if (phase === "end" && state.winner && !recordedRef.current) {
      recordedRef.current = true;
      setProgSnapshot(state.winner === "player" ? recordWin() : recordLoss());
    }
  }, [phase, state.winner]);

  function tryPlace(x: number, y: number) {
    if (!selected) return;
    // Allow mid-battle reinforcement: still constrained to first 4 cols + gold
    const err = canPlace(state, selected, x, y, "player");
    if (err) { setError(err); setTimeout(() => setError(null), 1800); return; }
    setState((s) => {
      const ns = placeUnit(s, selected, x, y, "player");
      recomputeVisibility(ns);
      return ns;
    });
  }

  function startBattle() {
    if (state.units.filter((u) => u.faction === "player").length === 0) {
      setError("Schiera almeno un'unità!"); setTimeout(() => setError(null), 1800); return;
    }
    setState((s) => {
      let ns = aiSpawn(s, aiDeck);
      ns = aiSpawn(ns, aiDeck);
      ns = aiSpawn(ns, aiDeck);
      recomputeVisibility(ns);
      return ns;
    });
    setPhase("battle");
  }

  function restart() {
    const newSeed = Math.floor(Math.random() * 1e6);
    setSeed(newSeed);
    const s = newBattle(generateMap(newSeed), buildConfig());
    recomputeVisibility(s);
    setState(s);
    setPhase("deploy");
    setSelectedCardId(null);
    recordedRef.current = false;
    setProgSnapshot(loadProgression());
  }

  const playerUnits = state.units.filter((u) => u.faction === "player").length;
  const enemyVisibleUnits = state.units.filter(
    (u) => u.faction === "enemy" && state.visibility[Math.round(u.y)]?.[Math.round(u.x)]
  ).length;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-4 py-3 flex items-center justify-between border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/" className="font-display tracking-widest">⚔️ FANTAGUERRA</Link>
          <span className="stat-pill">Tick {state.tick}</span>
          <span className="stat-pill text-[color:var(--gold)]">💰 {state.playerGold}</span>
          <span className="stat-pill text-[color:var(--faction-player)]">🟦 {playerUnits}</span>
          <span className="stat-pill text-[color:var(--faction-enemy)]">🟥 visibili {enemyVisibleUnits}</span>
          <span className="stat-pill">🏘️ {state.villagesPlayer} / {state.villagesEnemy}</span>
          <span className="stat-pill" title="Difficoltà AI">🤖 {aiDifficultyLabel(progSnapshot)}</span>
        </div>
        <div className="flex gap-2">
          {phase === "deploy" && (
            <button onClick={startBattle} className="btn-primary text-sm">Inizia battaglia</button>
          )}
          <Link to="/upgrades" className="btn-ghost text-sm">Upgrade</Link>
          <button onClick={restart} className="btn-ghost text-sm">Nuova partita</button>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-3 p-3">
        {/* MAP */}
        <section className="panel p-3 overflow-auto">
          <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
            <span>{phase === "deploy"
              ? "🟦 Schiera nelle prime 4 colonne"
              : phase === "battle"
              ? "⚡ Battaglia in tempo reale — clicca una carta + casella per schierare rinforzi"
              : state.winner === "player" ? "🏆 Vittoria!" : "💀 Sconfitta"}
            </span>
            {selected && phase !== "end" && <span>Selezionato: <b>{selected.name}</b> ({selected.cost}💰)</span>}
            {error && <span className="text-[color:var(--blood)] font-bold">{error}</span>}
          </div>

          <div
            className="grid mx-auto"
            style={{
              gridTemplateColumns: `repeat(${MAP_W}, minmax(34px, 48px))`,
              gap: "2px",
              maxWidth: "100%",
            }}
          >
            {state.map.flatMap((row, y) =>
              row.map((tile, x) => {
                const visible = state.visibility[y][x];
                const unit = state.units.find((u) => Math.round(u.x) === x && Math.round(u.y) === y);
                const showUnit = unit && (unit.faction === "player" || visible);
                const isPlayerZone = x < 4;
                const isEnemyZone = x >= MAP_W - 4;
                const isHover = hover?.x === x && hover?.y === y;
                const canClickPlace = !!selected && phase !== "end";
                return (
                  <button
                    key={`${x}-${y}`}
                    onMouseEnter={() => setHover({ x, y })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => canClickPlace && tryPlace(x, y)}
                    className="relative aspect-square flex items-center justify-center text-sm select-none transition-all overflow-hidden rounded-[3px]"
                    style={{
                      backgroundImage: `url(${BIOME_ART[tile.biome]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: biomeColor(tile.biome),
                      outline: isHover && canClickPlace ? "2px solid var(--gold)" : undefined,
                      boxShadow: isPlayerZone
                        ? "inset 0 0 0 1px color-mix(in oklab, var(--faction-player) 50%, transparent)"
                        : isEnemyZone
                        ? "inset 0 0 0 1px color-mix(in oklab, var(--faction-enemy) 45%, transparent)"
                        : undefined,
                      cursor: canClickPlace ? "crosshair" : "default",
                    }}
                    title={`${biomeLabel(tile.biome)} (${x},${y})`}
                  >
                    {!visible && <span className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />}
                    {visible && (
                      <span
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(180deg, color-mix(in oklab, black 5%, transparent), color-mix(in oklab, black 35%, transparent))",
                        }}
                      />
                    )}
                    {visible && tile.village && (
                      <span className="absolute top-0 left-0.5 text-[10px] z-10 drop-shadow">🏘️</span>
                    )}
                    {visible && !showUnit && !tile.village && (
                      <span className="opacity-60 text-xs z-10 drop-shadow">{biomeIcon(tile.biome)}</span>
                    )}
                    {showUnit && unit && <UnitChip unit={unit} maxHp={maxHpFor(state, unit)} />}
                  </button>
                );
              })
            )}
          </div>

          {hover && (
            <div className="mt-3 text-xs text-muted-foreground">
              {biomeIcon(state.map[hover.y][hover.x].biome)} {biomeLabel(state.map[hover.y][hover.x].biome)}
              {state.map[hover.y][hover.x].village && " · 🏘️ Villaggio (genera monete)"}
            </div>
          )}
        </section>

        {/* SIDEBAR */}
        <aside className="panel p-3 flex flex-col gap-3 max-h-[calc(100vh-120px)] overflow-hidden">
          {phase === "end" && (
            <div className="panel p-4 text-center">
              <div className="text-4xl">{state.winner === "player" ? "🏆" : "💀"}</div>
              <div className="font-display text-2xl mt-1">
                {state.winner === "player" ? "Vittoria!" : "Sconfitta"}
              </div>
              {state.winner === "player" && (
                <p className="text-xs text-[color:var(--gold)] mt-1">
                  +1 Punto Comando · AI ora <b>{aiDifficultyLabel(progSnapshot)}</b>
                </p>
              )}
              <div className="flex gap-2 mt-3 justify-center">
                <button onClick={restart} className="btn-primary text-sm">Nuova battaglia</button>
                <Link to="/upgrades" className="btn-ghost text-sm">Upgrade</Link>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-lg mb-2">
              {phase === "deploy" ? "Schiera truppe" : "Rinforzi"}
            </h2>
            {deck.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nessuna carta nel deck. <Link to="/collection" className="underline">Costruiscine uno</Link>.
              </p>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(60vh)" }}>
                {deck.map((c) => (
                  <CardView
                    key={c.id}
                    card={c}
                    compact
                    selected={selectedCardId === c.id}
                    disabled={phase === "end" || c.cost > state.playerGold}
                    onClick={() => setSelectedCardId(selectedCardId === c.id ? null : c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-2">
            <h3 className="font-display text-sm mb-1">Diario</h3>
            <div className="text-[11px] text-muted-foreground space-y-0.5 overflow-y-auto max-h-32">
              {state.log.slice().reverse().map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function UnitChip({ unit, maxHp }: { unit: { cardId: string; faction: "player" | "enemy"; hp: number }; maxHp: number }) {
  const card = CARD_BY_ID(unit.cardId);
  const hpPct = Math.max(0, Math.min(100, (unit.hp / maxHp) * 100));
  const ring = unit.faction === "player" ? "var(--faction-player)" : "var(--faction-enemy)";
  return (
    <div
      className="relative w-full h-full flex items-center justify-center rounded z-10"
      style={{
        boxShadow: `inset 0 0 0 2px ${ring}, 0 0 8px color-mix(in oklab, ${ring} 60%, transparent)`,
        background: `radial-gradient(circle, color-mix(in oklab, ${ring} 55%, transparent), color-mix(in oklab, ${ring} 20%, transparent))`,
      }}
      title={`${card.name} HP ${unit.hp}/${maxHp}`}
    >
      <span className="text-base leading-none drop-shadow">{card.emoji}</span>
      <span
        className="absolute bottom-0 left-0 h-0.5"
        style={{ width: `${hpPct}%`, background: hpPct > 50 ? "var(--gold)" : "var(--blood)" }}
      />
    </div>
  );
}
