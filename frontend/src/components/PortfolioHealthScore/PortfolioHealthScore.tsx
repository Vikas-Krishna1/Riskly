import { useState, useEffect } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import './PortfolioHealthScore.css';

interface HealthScoreData {
  portfolioId: string;
  portfolioName: string;
  healthScore: number;
  categories: {
    diversification: { score: number; maxScore: number };
    riskAdjustedReturns: { score: number; maxScore: number };
    concentration: { score: number; maxScore: number };
    performance: { score: number; maxScore: number };
    riskManagement: { score: number; maxScore: number };
  };
  suggestions: string[];
  timestamp: string;
}

interface PortfolioHealthScoreProps {
  portfolioId: string;
}

export default function PortfolioHealthScore({ portfolioId }: PortfolioHealthScoreProps) {
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthScore();
  }, [portfolioId]);

  const fetchHealthScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getHealthScore(portfolioId);
      setHealthScore(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health score');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="health-score-container">
        <div className="loading">Loading health score...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="health-score-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!healthScore) {
    return null;
  }

  return (
    <div className="health-score-container">
      <div className="health-score-header">
        <h2>Portfolio Health Score</h2>
        <button onClick={fetchHealthScore} className="refresh-btn">Refresh</button>
      </div>

      <div className="health-score-main">
        <div className="health-score-circle">
          <div
            className="score-circle"
            style={{
              background: `conic-gradient(${getScoreColor(healthScore.healthScore)} 0deg ${healthScore.healthScore * 3.6}deg, #e5e7eb ${healthScore.healthScore * 3.6}deg 360deg)`,
            }}
          >
            <div className="score-inner">
              <div className="score-value">{healthScore.healthScore.toFixed(1)}</div>
              <div className="score-label">{getScoreLabel(healthScore.healthScore)}</div>
            </div>
          </div>
        </div>

        <div className="health-score-breakdown">
          <h3>Category Breakdown</h3>
          <div className="categories-list">
            {Object.entries(healthScore.categories).map(([key, value]) => {
              const categoryName = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())
                .trim();
              const percentage = (value.score / value.maxScore) * 100;
              
              return (
                <div key={key} className="category-item">
                  <div className="category-header">
                    <span className="category-name">{categoryName}</span>
                    <span className="category-score">
                      {value.score.toFixed(1)} / {value.maxScore}
                    </span>
                  </div>
                  <div className="category-bar">
                    <div
                      className="category-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getScoreColor(value.score),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {healthScore.suggestions && healthScore.suggestions.length > 0 && (
        <div className="health-score-suggestions">
          <h3>Improvement Suggestions</h3>
          <ul>
            {healthScore.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

