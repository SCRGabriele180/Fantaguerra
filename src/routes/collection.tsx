import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CARDS } from "@/game/cards";
import { CardView } from "@/components/game/CardView";
import { loadDeck, saveDeck } from "@/game/deck-storage";
import type { Card } from "@/game/types";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "Collezione e formazione · Fantaguerra" },
      { name: "description", content: "Sfoglia tutte le carte di Fantaguerra e costruisci la tua formazione personalizzata." },
    ],
  }),
  component: CollectionPage,
});

const FILTERS: { id: Card["type"] | "all"; label: string }[] = [
  { id: "all", label: "Tutte" },
  { id: "leader", label: "Leader" },
  { id: "soldier", label: "Soldati" },
  { id: "vehicle", label: "Mezzi" },
];

function CollectionPage() {
  const [deck, setDeck] = useState<string[]>([]);
  const [filter, setFilter] = useState<Card["type"] | "all">("all");

  useEffect(() => { setDeck(loadDeck()); }, []);

  const filtered = useMemo(
    () => CARDS.filter((c) => filter === "all" || c.type === filter),
    [filter]
  );

  function toggle(id: string) {
    setDeck((d) => {
      const next = d.includes(id) ? d.filter((x) => x !== id) : [...d, id];
      saveDeck(next);
      return next;
    });
  }

  const deckCards = deck.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean) as Card[];
  const totalCost = deckCards.reduce((s, c) => s + c.cost, 0);
  const leaders = deckCards.filter((c) => c.type === "leader").length;

  return (
    <main className="min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <Link to="/" className="font-display text-xl tracking-widest">⚔️ FANTAGUERRA</Link>
        <nav className="flex gap-2">
          <Link to="/battle" className="btn-primary text-sm">Vai in battaglia</Link>
        </nav>
      </header>

      <div className="px-6 py-6 grid lg:grid-cols-[1fr_360px] gap-6 max-w-7xl mx-auto">
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold">Collezione</h1>
              <p className="text-sm text-muted-foreground">Seleziona le carte per la tua formazione personalizzata.</p>
            </div>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`btn-ghost text-xs ${filter === f.id ? "border-[color:var(--gold)] text-[color:var(--gold)]" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <CardView key={c.id} card={c} selected={deck.includes(c.id)} onClick={() => toggle(c.id)} />
            ))}
          </div>
        </section>

        <aside className="panel p-4 h-fit lg:sticky lg:top-4">
          <h2 className="font-display text-xl mb-2">La tua formazione</h2>
          <div className="flex flex-wrap gap-2 text-xs mb-3">
            <span className="stat-pill">Carte {deckCards.length}</span>
            <span className="stat-pill">Leader {leaders}</span>
            <span className="stat-pill text-[color:var(--gold)]">💰 totale {totalCost}</span>
          </div>
          {leaders === 0 && (
            <p className="text-xs text-[color:var(--blood)] mb-2">Aggiungi almeno un Leader.</p>
          )}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {deckCards.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Nessuna carta selezionata.</p>
            )}
            {deckCards.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border border-border rounded px-2 py-1">
                <span>{c.emoji} {c.name}</span>
                <button className="text-xs text-[color:var(--blood)] hover:underline" onClick={() => toggle(c.id)}>Rimuovi</button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
