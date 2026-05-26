import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-battlefield.jpg";
import { useEffect, useState } from "react";
import { loadProgression, aiDifficultyLabel, type Progression } from "@/game/progression";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fantaguerra — Strategia di guerra a carte" },
      { name: "description", content: "Comanda il tuo esercito, conquista territori e domina la mappa in Fantaguerra, gioco strategico a carte." },
      { property: "og:title", content: "Fantaguerra — Strategia di guerra a carte" },
      { property: "og:description", content: "Costruisci il tuo deck, schiera truppe e conquista la mappa." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Home,
});

function Home() {
  const [prog, setProg] = useState<Progression | null>(null);
  useEffect(() => setProg(loadProgression()), []);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-display text-xl tracking-widest">FANTAGUERRA</span>
        </div>
        <nav className="flex gap-2 flex-wrap">
          <Link to="/upgrades" className="btn-ghost text-sm">Quartier Generale</Link>
          <Link to="/collection" className="btn-ghost text-sm">Collezione</Link>
          <Link to="/how-to-play" className="btn-ghost text-sm">Come si gioca</Link>
          <Link to="/credits" className="btn-ghost text-sm">Crediti</Link>
        </nav>
      </header>

      <section className="relative flex-1 flex items-center justify-center px-6 py-20 overflow-hidden">
        <img
          src={heroImg}
          alt="Campo di battaglia di Fantaguerra"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.5) saturate(1.15) contrast(1.1)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, color-mix(in oklab, var(--background) 60%, transparent) 55%, var(--background) 100%)",
          }}
        />
        <div className="relative max-w-3xl text-center">
          <p className="text-[color:var(--gold)] tracking-[0.4em] text-xs mb-4">COMANDANTE SUPREMO</p>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
            La mappa è tua.<br />
            <span className="text-[color:var(--gold)]">Devi solo prenderla.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Recluta truppe disegnate a mano, sfrutta foreste, montagne e villaggi,
            e fai pagare ogni nemico abbattuto — ogni uccisione ti riempie la cassa.
            Vinci, potenzia il tuo esercito, affronta un'AI che impara dalle tue vittorie.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/battle" className="btn-primary">Inizia battaglia</Link>
            <Link to="/collection" className="btn-ghost">Costruisci deck</Link>
            <Link to="/upgrades" className="btn-ghost">Potenzia esercito</Link>
          </div>

          {prog && (prog.wins > 0 || prog.points > 0) && (
            <div className="mt-8 inline-flex items-center gap-3 panel px-4 py-2 text-sm">
              <span className="text-[color:var(--gold)] font-display">🏆 {prog.wins}</span>
              <span className="opacity-50">·</span>
              <span>AI: <b>{aiDifficultyLabel(prog)}</b></span>
              {prog.points > 0 && (
                <>
                  <span className="opacity-50">·</span>
                  <Link to="/upgrades" className="text-[color:var(--gold)] underline">
                    {prog.points} pt da spendere
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-14 bg-[color:var(--card)]/40 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl text-center mb-8">
            Cosa rende <span className="text-[color:var(--gold)]">Fantaguerra</span> diverso
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { e: "🃏", t: "Carte disegnate", d: "10+ unità con stile fatto a mano" },
              { e: "💰", t: "Taglie sui nemici", d: "Ogni kill ti dà oro per spingere oltre" },
              { e: "🗺️", t: "Mappe organiche", d: "Foreste, montagne, mari, villaggi" },
              { e: "🤖", t: "AI che cresce", d: "Più vinci, più diventa pericolosa" },
            ].map((f) => (
              <div key={f.t} className="panel p-4">
                <div className="text-3xl">{f.e}</div>
                <div className="font-display font-bold mt-2">{f.t}</div>
                <div className="text-xs text-muted-foreground">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground border-t border-border">
        Fantaguerra · Strategia di guerra a carte ·{" "}
        <Link to="/credits" className="text-[color:var(--gold)] underline">Crediti</Link>
      </footer>
    </main>
  );
}
