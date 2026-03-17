import { useState } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import BacktestResults from './BacktestResults';
import './BacktestingEngine.css';

interface BacktestingEngineProps {
  portfolioId: string;
}

export default function BacktestingEngine({ portfolioId }: BacktestingEngineProps) {
  const [period, setPeriod] = useState('1y');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const backtestData: any = { period };
      if (startDate) backtestData.startDate = startDate;
      if (endDate) backtestData.endDate = endDate;
      
      const result = await portfolioService.runBacktest(portfolioId, backtestData);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backtesting-engine">
      <div className="backtesting-header">
        <h2>Portfolio Backtesting Engine</h2>
      </div>

      <div className="backtest-config">
        <h3>Backtest Configuration</h3>
        <div className="config-options">
          <div className="config-group">
            <label>Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="1y">1 Year</option>
              <option value="3y">3 Years</option>
              <option value="5y">5 Years</option>
              <option value="10y">10 Years</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div className="config-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="config-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <button onClick={handleBacktest} className="run-backtest-btn" disabled={loading}>
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {error && (
        <div className="backtest-error">
          {error}
        </div>
      )}

      {results && (
        <BacktestResults results={results} />
      )}

      {!results && !loading && (
        <div className="backtest-prompt">
          <p>Test your portfolio's historical performance by running a backtest.</p>
          <p>Select a time period and click "Run Backtest" to see how your portfolio would have performed.</p>
        </div>
      )}
    </div>
  );
}

