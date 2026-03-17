import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './BacktestingEngine.css';

interface BacktestResultsProps {
  results: {
    startDate: string;
    endDate: string;
    period: string;
    initialValue: number;
    finalValue: number;
    totalReturn: number;
    annualizedReturn: number;
    metrics: {
      sharpeRatio: number;
      sortinoRatio: number;
      volatility: number;
      maxDrawdown: number;
      dailyReturn: number;
    };
    historicalValue: Array<{ Date: string; Value: number }>;
    bestDay: { date: string; return: number };
    worstDay: { date: string; return: number };
    holdings: Array<{
      symbol: string;
      shares: number;
      initialValue: number;
      finalValue: number;
    }>;
  };
}

export default function BacktestResults({ results }: BacktestResultsProps) {
  const chartData = results.historicalValue.map(item => ({
    date: item.Date,
    value: item.Value,
  }));

  return (
    <div className="backtest-results">
      <div className="results-header">
        <h3>Backtest Results</h3>
        <div className="results-period">
          {results.startDate} to {results.endDate} ({results.period})
        </div>
      </div>

      <div className="results-summary">
        <div className="summary-card">
          <div className="summary-label">Initial Value</div>
          <div className="summary-value">${results.initialValue.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Final Value</div>
          <div className="summary-value">${results.finalValue.toLocaleString()}</div>
        </div>
        <div className="summary-card highlight">
          <div className="summary-label">Total Return</div>
          <div className={`summary-value ${results.totalReturn >= 0 ? 'positive' : 'negative'}`}>
            {results.totalReturn >= 0 ? '+' : ''}{results.totalReturn.toFixed(2)}%
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Annualized Return</div>
          <div className={`summary-value ${results.annualizedReturn >= 0 ? 'positive' : 'negative'}`}>
            {results.annualizedReturn >= 0 ? '+' : ''}{results.annualizedReturn.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="results-chart">
        <h4>Portfolio Value Over Time</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Portfolio Value"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="results-metrics">
        <h4>Performance Metrics</h4>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">Sharpe Ratio</span>
            <span className="metric-value">{results.metrics.sharpeRatio.toFixed(3)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Sortino Ratio</span>
            <span className="metric-value">{results.metrics.sortinoRatio.toFixed(3)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Volatility</span>
            <span className="metric-value">{results.metrics.volatility.toFixed(2)}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Max Drawdown</span>
            <span className="metric-value negative">{results.metrics.maxDrawdown.toFixed(2)}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Best Day</span>
            <span className="metric-value positive">
              {results.bestDay.date}: +{results.bestDay.return.toFixed(2)}%
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Worst Day</span>
            <span className="metric-value negative">
              {results.worstDay.date}: {results.worstDay.return.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="holdings-performance">
        <h4>Holdings Performance</h4>
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Shares</th>
              <th>Initial Value</th>
              <th>Final Value</th>
              <th>Return</th>
            </tr>
          </thead>
          <tbody>
            {results.holdings.map((holding, index) => {
              const return_pct = holding.initialValue > 0 
                ? ((holding.finalValue - holding.initialValue) / holding.initialValue * 100) 
                : 0;
              return (
                <tr key={index}>
                  <td className="symbol-cell">{holding.symbol}</td>
                  <td>{holding.shares.toFixed(2)}</td>
                  <td>${holding.initialValue.toFixed(2)}</td>
                  <td>${holding.finalValue.toFixed(2)}</td>
                  <td className={return_pct >= 0 ? 'positive' : 'negative'}>
                    {return_pct >= 0 ? '+' : ''}{return_pct.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

