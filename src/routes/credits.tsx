import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Crediti · Fantaguerra" },
      { name: "description", content: "Le menti dietro Fantaguerra." },
    ],
  }),
  component: CreditsPage,
});

const TEAM = [
  "Gabriele Massari",
  "Edoardo Russo",
  "Gad Malak",
  "Anni Riccardo",
];

function CreditsPage() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10 flex-wrap gap-2">
        <Link to="/" className="font-display tracking-widest text-xl">FANTAGUERRA</Link>
        <nav className="flex gap-2 text-sm">
          <Link to="/battle" className="btn-primary">Battaglia</Link>
          <Link to="/" className="btn-ghost">Home</Link>
        </nav>
      </header>

      <section className="text-center mb-12">
        <p className="text-[color:var(--gold)] tracking-[0.4em] text-xs mb-3">QUARTIER GENERALE</p>
        <h1 className="font-display text-5xl md:text-6xl">Il Comando Supremo</h1>
      </section>

      <div className="grid sm:grid-cols-2 gap-4">
        {TEAM.map((name) => (
          <div key={name} className="card-handdrawn p-6 text-center">
            <div className="font-display text-2xl">{name}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link to="/battle" className="btn-primary">Torna al fronte</Link>
      </div>
    </main>
  );
}
