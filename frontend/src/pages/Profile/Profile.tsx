import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { portfolioService } from '../../components/PortfolioForm/portfolioService';
import { Portfolio, UserProfile } from '../../components/PortfolioForm/types';
import ProfileSettings from '../../components/ProfileSettings/ProfileSettings';
import './Profile.css';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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
      
      // Fetch user profile if user is available
      if (user?.id) {
        try {
          const fullProfile = await portfolioService.getUserProfile(user.id);
          setProfile(fullProfile);
        } catch (error) {
          // If profile fetch fails, use basic user info
          setProfile({
            id: user.id,
            username: user.username,
            email: user.email
          });
        }
      }
      
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

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    fetchUserData(); // Refresh to get latest data
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-message">Loading profile...</div>
      </div>
    );
  }

  const displayName = profile?.displayName || user?.username || 'User';
  const avatar = profile?.avatar;
  const bio = profile?.bio;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-section">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-large">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name-section">
            <h1 className="profile-name">{displayName}</h1>
            {user?.id === userId && (
              <button
                className="profile-edit-button"
                onClick={() => setShowSettings(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          <p className="profile-username">@{user?.username || 'user'}</p>
          {bio && <p className="profile-bio">{bio}</p>}
          {profile?.profilePrivacy && (
            <span className={`profile-privacy-badge ${profile.profilePrivacy}`}>
              {profile.profilePrivacy === 'public' ? '🌐 Public' : '🔒 Private'}
            </span>
          )}
        </div>
      </div>

      {showSettings && profile && (
        <ProfileSettings
          profile={profile}
          onUpdate={handleProfileUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}

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

