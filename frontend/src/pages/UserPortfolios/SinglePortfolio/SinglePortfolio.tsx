
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioService } from '../../../components/PortfolioForm/portfolioService';
import { Portfolio } from '../../../components/PortfolioForm/types';
import HoldingForm from '../../../components/HoldingForm/HoldingForm';
import './SinglePortfolio.css';

// Define the type for the analytics data
interface PortfolioAnalytics {
  portfolioName: string;
  totalPortfolioValue: number;
  analytics: {
    dailyReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  holdings: {
    symbol: string;
    shares: number;
    purchasePrice: number;
    currentPrice: number;
    currentValue: number;
    purchaseValue: number;
    gainLoss: number;
  }[];
  historicalValue: {
    Date: string;
    Total: number;
  }[];
}

const SinglePortfolio = () => {
  const { userId, portfolioId } = useParams<{ userId: string; portfolioId: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!portfolioId) {
      setError('Portfolio ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await portfolioService.getById(portfolioId);
      setPortfolio(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleAnalyze = async () => {
    if (!portfolioId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const data = await portfolioService.getAnalytics(portfolioId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="loading-message">Loading portfolio...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!portfolio) {
    return <div className="info-message">Portfolio not found.</div>;
  }

  return (
    <div className="single-portfolio-container">
      <header className="portfolio-header">
        <h1>{portfolio.name}</h1>
        <p className="portfolio-description">{portfolio.description}</p>
      </header>

      <main className="portfolio-main-content">
        <section className="holdings-section">
          <h2 className="section-title">Holdings</h2>
          {portfolio.holdings && portfolio.holdings.length > 0 ? (
            <ul className="holdings-list">
              {portfolio.holdings.map((holding) => (
                <li key={holding.id} className="holding-item">
                  <span className="holding-symbol">{holding.symbol}</span>
                  <span className="holding-details">{holding.shares} shares @ ${holding.purchasePrice.toFixed(2)}</span>
                  <span className="holding-date">Purchased: {new Date(holding.purchaseDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-holdings-message">This portfolio has no holdings yet.</p>
          )}
        </section>

        <aside className="form-section">
          <HoldingForm portfolioId={portfolio.id} onSuccess={fetchPortfolio} />
        </aside>
      </main>
      <div className="analyze-button-container">
        <button className="analyze-button" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : 'Analyze Portfolio'}
        </button>
      </div>

      {analytics && (
        <section className="analytics-section">
          <h2 className="section-title">Portfolio Analytics</h2>
          <div className="analytics-summary">
            <p><strong>Total Value:</strong> ${analytics.totalPortfolioValue.toFixed(2)}</p>
            <p><strong>Avg. Daily Return:</strong> {(analytics.analytics.dailyReturn * 100).toFixed(4)}%</p>
            <p><strong>Volatility:</strong> {(analytics.analytics.volatility * 100).toFixed(4)}%</p>
            <p><strong>Sharpe Ratio:</strong> {analytics.analytics.sharpeRatio.toFixed(4)}</p>
          </div>

          <h3 className="subsection-title">Analyzed Holdings</h3>
          <ul className="holdings-list">
            {analytics.holdings.map((holding) => (
              <li key={holding.symbol} className="holding-item">
                <span className="holding-symbol">{holding.symbol}</span>
                <span className="holding-details">
                  {holding.shares} shares | Current Value: ${holding.currentValue.toFixed(2)} | Gain/Loss: ${holding.gainLoss.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SinglePortfolio;
