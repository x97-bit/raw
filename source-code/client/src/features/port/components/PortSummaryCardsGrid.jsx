import SummaryCard from "../../../components/SummaryCard";

export default function PortSummaryCardsGrid({
  cards,
  className = "grid grid-cols-2 gap-4 md:grid-cols-4",
}) {
  if (!cards?.length) return null;

  return (
    <div className={className}>
      {cards.map(card => (
        <SummaryCard
          key={`${card.key}-${card.label}`}
          label={card.label}
          value={card.value}
          tone={card.accent || "text-utility-strong"}
        />
      ))}
    </div>
  );
}
