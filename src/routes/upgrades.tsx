import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  loadProgression,
  purchaseUpgrade,
  resetProgression,
  UPGRADES,
  playerStartingGold,
  playerDamageMult,
  playerHpMult,
  aiDifficultyLabel,
  aiStartingGold,
  aiDamageMult,
} from "@/game/progression";

export const Route = createFileRoute("/upgrades")({
  head: () => ({
    meta: [
      { title: "Quartier Generale · Fantaguerra" },
      { name: "description", content: "Spendi i tuoi punti vittoria per potenziare il tuo esercito." },
    ],
  }),
  component: UpgradesPage,
});

function UpgradesPage() {
  const [prog, setProg] = useState(() => loadProgression());

  const buy = (key: keyof typeof UPGRADES) => setProg(purchaseUpgrade(key));
  const reset = () => {
    if (confirm("Azzerare tutta la progressione (vittorie, punti, upgrade)?")) setProg(resetProgression());
  };

  const rows: Array<{ key: keyof typeof UPGRADES; level: number }> = [
    { key: "gold", level: prog.upgradeGold },
    { key: "damage", level: prog.upgradeDamage },
    { key: "hp", level: prog.upgradeHp },
  ];

  return (
    <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Link to="/" className="font-display tracking-widest text-xl">⚔️ FANTAGUERRA</Link>
        <nav className="flex gap-2 text-sm">
          <Link to="/battle" className="btn-primary">Battaglia</Link>
          <Link to="/collection" className="btn-ghost">Collezione</Link>
        </nav>
      </header>

      <section className="panel p-6 mb-6">
        <h1 className="font-display text-3xl mb-1">Quartier Generale</h1>
        <p className="text-muted-foreground text-sm">
          Ogni vittoria ti dà un <b>Punto Comando</b>. Spendili qui per potenziare il tuo esercito.
          Attenzione: l'AI nemica diventa più forte ad ogni vittoria.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat label="Vittorie" value={prog.wins} accent="gold" />
          <Stat label="Sconfitte" value={prog.losses} />
          <Stat label="Punti Comando" value={prog.points} accent="gold" />
          <Stat label="Difficoltà AI" value={aiDifficultyLabel(prog)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-xs">
          <Info label="Oro iniziale" value={`${playerStartingGold(prog)} 💰`} />
          <Info label="Danno" value={`×${playerDamageMult(prog).toFixed(2)}`} />
          <Info label="HP unità" value={`×${playerHpMult(prog).toFixed(2)}`} />
          <Info label="Oro iniziale AI" value={`${aiStartingGold(prog)} 💰`} />
          <Info label="Danno AI" value={`×${aiDamageMult(prog).toFixed(2)}`} />
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-3">
        {rows.map(({ key, level }) => {
          const def = UPGRADES[key];
          const maxed = level >= def.max;
          const canBuy = !maxed && prog.points >= def.cost;
          return (
            <div key={key} className="panel p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{def.icon}</span>
                <span className="stat-pill text-[color:var(--gold)]">Lv {level}/{def.max}</span>
              </div>
              <div>
                <div className="font-display text-lg">{def.name}</div>
                <p className="text-xs text-muted-foreground">{def.desc}</p>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: def.max }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded"
                    style={{
                      background: i < level
                        ? "var(--gold)"
                        : "color-mix(in oklab, var(--gold) 15%, transparent)",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => buy(key)}
                disabled={!canBuy}
                className="btn-primary text-sm disabled:opacity-40"
              >
                {maxed ? "Massimo livello" : `Potenzia (${def.cost} pt)`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button onClick={reset} className="btn-ghost text-xs">Reset progressione</button>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: "gold" }) {
  return (
    <div className="panel p-3 text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`font-display text-2xl mt-1 ${accent === "gold" ? "text-[color:var(--gold)]" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-border rounded px-2 py-1.5 bg-[color:var(--muted)]/40">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
