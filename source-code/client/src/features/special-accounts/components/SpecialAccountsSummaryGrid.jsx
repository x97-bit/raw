import SummaryCard from "../../../components/SummaryCard";

export default function SpecialAccountsSummaryGrid({ cards }) {
  if (!cards?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {cards.map(card => (
        <SummaryCard
          key={card.label}
          label={card.label}
          value={card.value}
          tone={card.tone}
        />
      ))}
    </div>
  );
}
