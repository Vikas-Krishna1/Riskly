import './TaxOptimization.css';

interface TaxSavingsCalculatorProps {
  totalPotentialSavings: number;
  totalUnrealizedGains: number;
  totalUnrealizedLosses: number;
  taxRate: number;
}

export default function TaxSavingsCalculator({
  totalPotentialSavings,
  totalUnrealizedGains,
  totalUnrealizedLosses,
  taxRate,
}: TaxSavingsCalculatorProps) {
  const netGainsLosses = totalUnrealizedGains - totalUnrealizedLosses;
  const offsetSavings = Math.min(totalUnrealizedGains, totalUnrealizedLosses) * (taxRate / 100);

  return (
    <div className="tax-savings-calculator">
      <h3>Tax Savings Summary</h3>
      <div className="savings-grid">
        <div className="savings-card">
          <div className="savings-label">Total Unrealized Gains</div>
          <div className="savings-value positive">${totalUnrealizedGains.toFixed(2)}</div>
        </div>
        <div className="savings-card">
          <div className="savings-label">Total Unrealized Losses</div>
          <div className="savings-value negative">${totalUnrealizedLosses.toFixed(2)}</div>
        </div>
        <div className="savings-card">
          <div className="savings-label">Net Gains/Losses</div>
          <div className={`savings-value ${netGainsLosses >= 0 ? 'positive' : 'negative'}`}>
            ${netGainsLosses.toFixed(2)}
          </div>
        </div>
        <div className="savings-card highlight">
          <div className="savings-label">Potential Tax Savings</div>
          <div className="savings-value highlight-value">${totalPotentialSavings.toFixed(2)}</div>
          <div className="savings-note">From tax-loss harvesting</div>
        </div>
        {offsetSavings > 0 && (
          <div className="savings-card">
            <div className="savings-label">Offset Savings</div>
            <div className="savings-value">${offsetSavings.toFixed(2)}</div>
            <div className="savings-note">From offsetting gains with losses</div>
          </div>
        )}
      </div>
    </div>
  );
}

