import { useState, useEffect } from 'react';
import { portfolioService } from '../../../components/PortfolioForm/portfolioService';
import { Portfolio } from '../../../components/PortfolioForm/types';
import PortfolioForm from '../../../components/PortfolioForm/PortfolioForm';
import './portFolioDash.css';
import { useNavigate } from 'react-router-dom';

export default function PortfolioDash() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);

  const fetchPortfolios = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portfolioService.getAll();
      setPortfolios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handlePortfolioCreated = () => {
    setShowForm(false);
    fetchPortfolios(); // Refresh the list
  };

  const handleCardClick = (portfolio: Portfolio) => {
    // Format portfolio name for URL (replace spaces with hyphens, lowercase)
    const portfolioSlug = portfolio.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/user/${portfolio.id}/portfolios/${portfolioSlug}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Prevent card click when deleting
    
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await portfolioService.delete(id);
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete portfolio');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="portfolio-list-container">
        <div className="loading">Loading portfolios...</div>
      </div>
    );
  }

  return (
    <div className="portfolio-list-container">
      <div className="portfolio-list-header">
        <h1>My Portfolios</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="add-portfolio-button"
        >
          {showForm ? 'Cancel' : '+ New Portfolio'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchPortfolios} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-wrapper">
          <PortfolioForm onSuccess={handlePortfolioCreated} />
        </div>
      )}

      {portfolios.length === 0 && !error ? (
        <div className="empty-state">
          <p>No portfolios yet.</p>
          <p>Create your first portfolio to get started!</p>
        </div>
      ) : (
        <div className="portfolio-grid">
          {portfolios.map((portfolio) => (
            <div 
              key={portfolio.id} 
              className="portfolio-card"
              onClick={() => handleCardClick(portfolio)}
            >
              <div className="portfolio-card-header">
                <h3 className="portfolio-name">{portfolio.name}</h3>
                <button
                  onClick={(e) => handleDelete(e, portfolio.id, portfolio.name)}
                  className="delete-button"
                  title="Delete portfolio"
                >
                  ×
                </button>
              </div>
              
              {portfolio.description && (
                <p className="portfolio-description">{portfolio.description}</p>
              )}
              
              <div className="portfolio-meta">
                {portfolio.created_at && (
                  <span className="meta-item">
                    Created: {formatDate(portfolio.created_at)}
                  </span>
                )}
                {portfolio.updated_at && portfolio.updated_at !== portfolio.created_at && (
                  <span className="meta-item">
                    Updated: {formatDate(portfolio.updated_at)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}