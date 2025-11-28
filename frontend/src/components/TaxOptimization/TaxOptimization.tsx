import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import TaxLossHarvesting from './TaxLossHarvesting';
import TaxSavingsCalculator from './TaxSavingsCalculator';
import './TaxOptimization.css';

interface TaxOptimizationProps {
  portfolioId: string;
}

export default function TaxOptimization({ portfolioId }: TaxOptimizationProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(25);

  useEffect(() => {
    fetchTaxOptimization();
  }, [portfolioId, taxRate]);

  const fetchTaxOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const optimizationData = await portfolioService.getTaxOptimization(portfolioId, taxRate);
      setData(optimizationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tax optimization suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tax-optimization">
        <div className="loading">Loading tax optimization suggestions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tax-optimization">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="tax-optimization">
      <div className="tax-header">
        <h2>Tax Optimization Engine</h2>
        <div className="tax-rate-selector">
          <label>Tax Rate:</label>
          <input
            type="number"
            step="1"
            min="0"
            max="50"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 25)}
            className="tax-rate-input"
          />
          <span>%</span>
        </div>
      </div>

      <TaxSavingsCalculator
        totalPotentialSavings={data.totalPotentialSavings}
        totalUnrealizedGains={data.totalUnrealizedGains}
        totalUnrealizedLosses={data.totalUnrealizedLosses}
        taxRate={data.taxRate}
      />

      {data.taxLossOpportunities && data.taxLossOpportunities.length > 0 && (
        <TaxLossHarvesting opportunities={data.taxLossOpportunities} />
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="tax-recommendations">
          <h3>Recommendations</h3>
          <div className="recommendations-list">
            {data.recommendations.map((rec: any, index: number) => (
              <div key={index} className={`recommendation-item priority-${rec.priority}`}>
                <div className="recommendation-header">
                  <span className="recommendation-category">{rec.category.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className={`priority-badge priority-${rec.priority}`}>{rec.priority}</span>
                </div>
                <div className="recommendation-action">{rec.action}</div>
                {rec.potentialSavings !== null && rec.potentialSavings > 0 && (
                  <div className="recommendation-savings">
                    Potential Savings: ${rec.potentialSavings.toFixed(2)}
                  </div>
                )}
                <div className="recommendation-rationale">{rec.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

