import type { Card } from "@/game/types";
import { CARD_ART } from "@/game/card-art";

const TYPE_LABEL: Record<Card["type"], string> = {
  leader: "Leader",
  soldier: "Soldato",
  vehicle: "Mezzo",
};

const TYPE_BADGE: Record<Card["type"], string> = {
  leader: "bg-[color:var(--gold)] text-[color:var(--primary-foreground)]",
  soldier: "bg-[color:var(--faction-player)] text-white",
  vehicle: "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]",
};

export function CardView({
  card,
  selected,
  onClick,
  compact,
  disabled,
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const art = CARD_ART[card.id];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "card-handdrawn text-left w-full transition-all overflow-hidden group",
        selected ? "ring-2 ring-[color:var(--gold)] -translate-y-0.5" : "hover:border-[color:var(--gold)]",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5 hover:rotate-[-0.4deg]",
      ].join(" ")}
      style={{ padding: 0 }}
    >
      {art && (
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: compact ? "16/7" : "4/3" }}
        >
          <img
            src={art}
            alt={card.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, color-mix(in oklab, var(--card) 95%, transparent) 100%)",
            }}
          />
          <span className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold bg-black/55 backdrop-blur text-white">
            {card.emoji} {TYPE_LABEL[card.type]}
          </span>
          <span className="absolute top-1.5 right-1.5 stat-pill text-[color:var(--gold)] bg-black/55 backdrop-blur">
            💰 {card.cost}
          </span>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-display font-bold leading-tight">{card.name}</div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${TYPE_BADGE[card.type]}`}>
              {TYPE_LABEL[card.type]}
            </span>
          </div>
          {!art && <span className="stat-pill text-[color:var(--gold)]">💰 {card.cost}</span>}
        </div>
        {!compact && <p className="text-xs text-muted-foreground mt-2 italic">{card.description}</p>}
        <div className="grid grid-cols-4 gap-1 mt-2 text-xs">
          <div className="stat-pill justify-center" title="Vita">❤️ {card.hp}</div>
          <div className="stat-pill justify-center" title="Attacco">⚔️ {card.attack}</div>
          <div className="stat-pill justify-center" title="Difesa">🛡️ {card.defense}</div>
          <div className="stat-pill justify-center" title="Velocità">⚡ {card.speed}</div>
        </div>
        {card.ability && !compact && (
          <div className="mt-2 text-xs">
            <span className="font-bold text-[color:var(--gold)]">Abilità:</span>{" "}
            <span className="text-muted-foreground">{card.abilityDesc}</span>
          </div>
        )}
        {!compact && (
          <div className="mt-2 text-[11px] text-muted-foreground">
            Punteggio <span className="text-foreground font-bold">{card.score}</span> · Range {card.range}
          </div>
        )}
      </div>
    </button>
  );
}
