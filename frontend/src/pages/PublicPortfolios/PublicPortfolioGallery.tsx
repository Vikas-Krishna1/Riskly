import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioService } from '../../components/PortfolioForm/portfolioService';
import { PublicPortfolio } from '../../components/PortfolioForm/types';
import './PublicPortfolioGallery.css';

export default function PublicPortfolioGallery() {
  const [portfolios, setPortfolios] = useState<PublicPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicPortfolios();
  }, []);

  const fetchPublicPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getPublicPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('Failed to fetch public portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPortfolios = portfolios.filter(portfolio => {
    const query = searchQuery.toLowerCase();
    return (
      portfolio.name.toLowerCase().includes(query) ||
      portfolio.description?.toLowerCase().includes(query) ||
      portfolio.ownerUsername?.toLowerCase().includes(query) ||
      portfolio.ownerDisplayName?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="public-gallery-container">
        <div className="loading-message">Loading public portfolios...</div>
      </div>
    );
  }

  return (
    <div className="public-gallery-container">
      <div className="public-gallery-header">
        <h1>Public Portfolios</h1>
        <p className="gallery-subtitle">
          Discover and explore portfolios shared by the community
        </p>
      </div>

      <div className="gallery-search">
        <input
          type="text"
          placeholder="Search portfolios by name, description, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="gallery-search-input"
        />
      </div>

      {filteredPortfolios.length === 0 ? (
        <div className="empty-gallery">
          {searchQuery ? (
            <>
              <p>No portfolios found matching "{searchQuery}"</p>
              <button
                className="clear-search-button"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </>
          ) : (
            <p>No public portfolios available yet. Be the first to share your portfolio!</p>
          )}
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="gallery-portfolio-card"
              onClick={() => navigate(`/${portfolio.userId}/portfolios/${portfolio.id}`)}
            >
              <div className="portfolio-card-header">
                <h3 className="portfolio-card-title">{portfolio.name}</h3>
                <span className="public-badge">Public</span>
              </div>
              
              {portfolio.description && (
                <p className="portfolio-card-description">{portfolio.description}</p>
              )}

              <div className="portfolio-card-meta">
                <div className="portfolio-owner">
                  <span className="owner-icon">👤</span>
                  <span className="owner-name">
                    {portfolio.ownerDisplayName || portfolio.ownerUsername || 'Unknown'}
                  </span>
                </div>
                <div className="portfolio-stats">
                  <span className="stat-item">
                    📊 {portfolio.holdings?.length || 0} holdings
                  </span>
                  <span className="stat-item">
                    📅 {formatDate(portfolio.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

