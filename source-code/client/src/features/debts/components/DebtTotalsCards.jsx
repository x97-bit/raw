import SummaryCard from "../../../components/SummaryCard";
import { buildDebtTotalsCards } from "../debtsPageHelpers";

export default function DebtTotalsCards({ totals }) {
  const cards = buildDebtTotalsCards(totals);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
      {cards.map(card => (
        <SummaryCard
          key={card.key}
          label={card.label}
          value={card.value}
          tone={card.tone}
        />
      ))}
    </div>
  );
}
