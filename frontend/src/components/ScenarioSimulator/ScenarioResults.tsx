import './ScenarioSimulator.css';

interface ScenarioResultsProps {
  result: {
    scenarioType: string;
    scenarioName: string;
    scenarioDescription: string;
    currentValue: number;
    scenarioValue: number;
    totalChange: number;
    totalChangePercent: number;
    holdings: Array<{
      symbol: string;
      currentValue: number;
      scenarioValue: number;
      change: number;
      changePercent: number;
    }>;
    metrics: {
      currentDrawdown: number;
      scenarioDrawdown: number;
      currentVolatility: number;
      scenarioVolatility: number;
    };
  };
}

export default function ScenarioResults({ result }: ScenarioResultsProps) {
  const isPositive = result.totalChangePercent > 0;

  return (
    <div className="scenario-results">
      <div className="results-header">
        <h3>{result.scenarioName}</h3>
        <p className="scenario-description">{result.scenarioDescription}</p>
      </div>

      <div className="results-summary">
        <div className="summary-card">
          <div className="summary-label">Current Value</div>
          <div className="summary-value">${result.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Scenario Value</div>
          <div className={`summary-value ${isPositive ? 'positive' : 'negative'}`}>
            ${result.scenarioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Change</div>
          <div className={`summary-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{result.totalChangePercent.toFixed(2)}%
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Dollar Change</div>
          <div className={`summary-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}${result.totalChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="results-metrics">
        <h4>Risk Metrics Comparison</h4>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">Max Drawdown</span>
            <div className="metric-comparison">
              <span className="metric-current">{result.metrics.currentDrawdown.toFixed(2)}%</span>
              <span className="metric-arrow">→</span>
              <span className={`metric-scenario ${result.metrics.scenarioDrawdown > result.metrics.currentDrawdown ? 'worse' : 'better'}`}>
                {result.metrics.scenarioDrawdown.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-label">Volatility</span>
            <div className="metric-comparison">
              <span className="metric-current">{result.metrics.currentVolatility.toFixed(2)}%</span>
              <span className="metric-arrow">→</span>
              <span className={`metric-scenario ${result.metrics.scenarioVolatility > result.metrics.currentVolatility ? 'worse' : 'better'}`}>
                {result.metrics.scenarioVolatility.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="holdings-impact">
        <h4>Holdings Impact</h4>
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Current Value</th>
              <th>Scenario Value</th>
              <th>Change</th>
              <th>Change %</th>
            </tr>
          </thead>
          <tbody>
            {result.holdings.map((holding, index) => (
              <tr key={index}>
                <td className="symbol-cell">{holding.symbol}</td>
                <td>${holding.currentValue.toFixed(2)}</td>
                <td>${holding.scenarioValue.toFixed(2)}</td>
                <td className={holding.change >= 0 ? 'positive' : 'negative'}>
                  {holding.change >= 0 ? '+' : ''}${holding.change.toFixed(2)}
                </td>
                <td className={holding.changePercent >= 0 ? 'positive' : 'negative'}>
                  {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

