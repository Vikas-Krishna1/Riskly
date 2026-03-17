import './RebalancingAssistant.css';

interface RebalancingSuggestion {
  symbol: string;
  action: string;
  currentShares: number;
  targetShares: number;
  sharesToTrade: number;
  currentValue: number;
  targetValue: number;
  currentPercent: number;
  targetPercent: number;
  drift: number;
}

interface RebalancingSuggestionsProps {
  suggestions: {
    portfolioId: string;
    totalPortfolioValue: number;
    tolerance: number;
    suggestions: RebalancingSuggestion[];
    summary: {
      totalDrift: number;
      needsRebalancing: boolean;
      holdingsNeedingRebalancing: number;
      totalHoldings: number;
    };
  };
}

export default function RebalancingSuggestions({ suggestions }: RebalancingSuggestionsProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return '#10b981'; // green
      case 'SELL':
        return '#ef4444'; // red
      case 'HOLD':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return '↑';
      case 'SELL':
        return '↓';
      case 'HOLD':
        return '→';
      default:
        return '';
    }
  };

  return (
    <div className="rebalancing-suggestions">
      <div className="suggestions-summary">
        <h3>Rebalancing Summary</h3>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-label">Total Drift:</span>
            <span className="stat-value">{suggestions.summary.totalDrift.toFixed(2)}%</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Needs Rebalancing:</span>
            <span className={`stat-value ${suggestions.summary.needsRebalancing ? 'needs-rebalancing' : ''}`}>
              {suggestions.summary.needsRebalancing ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Holdings to Adjust:</span>
            <span className="stat-value">{suggestions.summary.holdingsNeedingRebalancing}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Tolerance:</span>
            <span className="stat-value">±{suggestions.tolerance}%</span>
          </div>
        </div>
      </div>

      <div className="suggestions-list">
        <h3>Suggested Actions</h3>
        <table className="suggestions-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Action</th>
              <th>Current %</th>
              <th>Target %</th>
              <th>Drift</th>
              <th>Shares to Trade</th>
              <th>Current Value</th>
              <th>Target Value</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.suggestions.map((suggestion, index) => (
              <tr key={index} className={suggestion.action === 'HOLD' ? 'hold-row' : ''}>
                <td className="symbol-cell">{suggestion.symbol}</td>
                <td>
                  <span
                    className="action-badge"
                    style={{ backgroundColor: getActionColor(suggestion.action) }}
                  >
                    {getActionIcon(suggestion.action)} {suggestion.action}
                  </span>
                </td>
                <td>{suggestion.currentPercent.toFixed(2)}%</td>
                <td>{suggestion.targetPercent.toFixed(2)}%</td>
                <td className={suggestion.drift > 0 ? 'drift-positive' : 'drift-negative'}>
                  {suggestion.drift > 0 ? '+' : ''}{suggestion.drift.toFixed(2)}%
                </td>
                <td className={suggestion.sharesToTrade !== 0 ? 'shares-to-trade' : ''}>
                  {suggestion.sharesToTrade > 0 ? '+' : ''}{suggestion.sharesToTrade.toFixed(2)}
                </td>
                <td>${suggestion.currentValue.toFixed(2)}</td>
                <td>${suggestion.targetValue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

