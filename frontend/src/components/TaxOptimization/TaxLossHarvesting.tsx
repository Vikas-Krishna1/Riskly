import './TaxOptimization.css';

interface TaxLossOpportunity {
  symbol: string;
  currentValue: number;
  purchaseValue: number;
  lossAmount: number;
  lossPercent: number;
  potentialTaxSavings: number;
  isLongTerm: boolean;
  washSaleWarning: boolean;
  daysHeld?: number;
}

interface TaxLossHarvestingProps {
  opportunities: TaxLossOpportunity[];
}

export default function TaxLossHarvesting({ opportunities }: TaxLossHarvestingProps) {
  return (
    <div className="tax-loss-harvesting">
      <h3>Tax-Loss Harvesting Opportunities</h3>
      <p className="harvesting-description">
        The following holdings have unrealized losses that could be harvested to offset capital gains and reduce your tax liability.
      </p>
      <table className="harvesting-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Loss Amount</th>
            <th>Loss %</th>
            <th>Potential Tax Savings</th>
            <th>Holding Period</th>
            <th>Warnings</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp, index) => (
            <tr key={index}>
              <td className="symbol-cell">{opp.symbol}</td>
              <td className="loss-amount">${opp.lossAmount.toFixed(2)}</td>
              <td className="loss-percent">{opp.lossPercent.toFixed(2)}%</td>
              <td className="tax-savings">${opp.potentialTaxSavings.toFixed(2)}</td>
              <td>
                {opp.daysHeld !== undefined ? (
                  <span className={opp.isLongTerm ? 'long-term' : 'short-term'}>
                    {opp.isLongTerm ? 'Long-term' : 'Short-term'} ({opp.daysHeld} days)
                  </span>
                ) : (
                  <span>Unknown</span>
                )}
              </td>
              <td>
                {opp.washSaleWarning && (
                  <span className="wash-sale-warning" title="Wash-sale rule may apply if sold within 30 days of purchase">
                    ⚠️ Wash Sale Risk
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

