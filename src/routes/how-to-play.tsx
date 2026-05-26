import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/how-to-play")({
  head: () => ({
    meta: [
      { title: "Come si gioca · Fantaguerra" },
      { name: "description", content: "Regole, biomi, economia e strategie di Fantaguerra." },
    ],
  }),
  component: HowToPlay,
});

function HowToPlay() {
  return (
    <main className="min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <Link to="/" className="font-display text-xl tracking-widest">⚔️ FANTAGUERRA</Link>
        <Link to="/battle" className="btn-primary text-sm">Inizia battaglia</Link>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header>
          <h1 className="text-4xl font-display font-bold">Come si gioca</h1>
          <p className="text-muted-foreground mt-2">Sei il Comandante Supremo. Recluta, schiera e conquista.</p>
        </header>

        <section className="panel p-5">
          <h2 className="text-2xl font-display mb-2">🃏 Carte</h2>
          <p className="text-sm text-muted-foreground">
            Tre tipi di carte: <b>Leader</b> (bonus strategici), <b>Soldati</b> (fanteria, ranger, alpini),
            <b> Mezzi</b> (carri, jeep, aerei, navi). Ogni carta ha statistiche, abilità uniche e un costo in monete.
          </p>
        </section>

        <section className="panel p-5">
          <h2 className="text-2xl font-display mb-2">💰 Economia</h2>
          <p className="text-sm text-muted-foreground">
            Inizi con <b className="text-[color:var(--gold)]">500 monete</b>. Ogni unità schierata costa monete.
            Conquista i <b>villaggi</b> sulla mappa per generare entrate periodiche.
          </p>
        </section>

        <section className="panel p-5">
          <h2 className="text-2xl font-display mb-2">🌍 Biomi</h2>
          <ul className="text-sm space-y-1">
            <li>🌵 <b>Deserto</b> — visibilità alta, difesa ridotta</li>
            <li>🌲 <b>Foresta</b> — ideale per imboscate dei Ranger</li>
            <li>⛰️ <b>Montagna</b> — bonus difesa per Alpini, intransitabile per i veicoli</li>
            <li>🌊 <b>Mare</b> — solo navi e aerei possono attraversarlo</li>
            <li>🏘️ <b>Villaggio</b> — genera monete a chi lo controlla</li>
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="text-2xl font-display mb-2">⚔️ Battaglia</h2>
          <p className="text-sm text-muted-foreground">
            Schiera le tue truppe nelle prime 4 colonne, poi avvia la battaglia. Le unità si muovono
            e attaccano in <b>tempo reale</b>. Vinci eliminando l'esercito nemico quando non ha più
            risorse per riprendersi.
          </p>
        </section>

        <div className="text-center">
          <Link to="/battle" className="btn-primary">Sono pronto, alla battaglia!</Link>
        </div>
      </article>
    </main>
  );
}
