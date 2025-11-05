
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { portfolioService } from '../../../components/PortfolioForm/portfolioService';
import { Portfolio } from '../../../components/PortfolioForm/types';
import HoldingForm from '../../../components/HoldingForm/HoldingForm';
import './SinglePortfolio.css';

const SinglePortfolio = () => {
  const { userId, portfolioId } = useParams<{ userId: string; portfolioId: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
};

export default SinglePortfolio;
