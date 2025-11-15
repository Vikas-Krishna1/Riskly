import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { portfolioService } from '../../components/PortfolioForm/portfolioService';
import { Portfolio } from '../../components/PortfolioForm/types';
import './Profile.css';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPortfolios: 0,
    totalHoldings: 0,
    totalValue: 0,
  });

  useEffect(() => {
    if (!isAuthenticated || !userId || userId !== user?.id) {
      navigate('/home');
      return;
    }

    fetchUserData();
  }, [userId, isAuthenticated, user]);

  const fetchUserData = async () => {
    try {
      const data = await portfolioService.getAll();
      setPortfolios(data);
      
      // Calculate stats
      const totalHoldings = data.reduce((sum, p) => sum + (p.holdings?.length || 0), 0);
      
      // Try to get total value from analytics (simplified - would need to fetch all analytics)
      setStats({
        totalPortfolios: data.length,
        totalHoldings,
        totalValue: 0, // Would need to calculate from analytics
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-message">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user?.username || 'User'}</h1>
          <p className="profile-email">{user?.email || 'No email'}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-value">{stats.totalPortfolios}</div>
          <div className="stat-label">Portfolios</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.totalHoldings}</div>
          <div className="stat-label">Total Holdings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">—</div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>

      <div className="profile-section">
        <h2 className="section-title">My Portfolios</h2>
        {portfolios.length > 0 ? (
          <div className="portfolios-grid">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="portfolio-card"
                onClick={() => navigate(`/${userId}/portfolios/${portfolio.id}`)}
              >
                <h3 className="portfolio-card-title">{portfolio.name}</h3>
                <p className="portfolio-card-description">{portfolio.description || 'No description'}</p>
                <div className="portfolio-card-meta">
                  <span className="portfolio-holdings">
                    {portfolio.holdings?.length || 0} holdings
                  </span>
                  <span className="portfolio-date">
                    {new Date(portfolio.createdAt || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No portfolios yet. Create your first portfolio to get started!</p>
            <button
              className="create-portfolio-btn"
              onClick={() => navigate(`/${userId}/portfolios`)}
            >
              Create Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

