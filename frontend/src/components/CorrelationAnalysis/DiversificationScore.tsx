import './CorrelationAnalysis.css';

interface DiversificationScoreProps {
  score: number;
  averageCorrelation: number;
  dataPoints: number;
}

export default function DiversificationScore({ score, averageCorrelation, dataPoints }: DiversificationScoreProps) {
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

  return (
    <div className="diversification-score">
      <h3>Diversification Score</h3>
      <div className="score-display">
        <div className="score-circle-container">
          <div
            className="score-circle"
            style={{
              background: `conic-gradient(${getScoreColor(score)} 0deg ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg 360deg)`,
            }}
          >
            <div className="score-inner">
              <div className="score-value">{score.toFixed(1)}</div>
              <div className="score-label">{getScoreLabel(score)}</div>
            </div>
          </div>
        </div>
        <div className="score-details">
          <div className="score-detail">
            <span className="detail-label">Average Correlation:</span>
            <span className="detail-value">{averageCorrelation.toFixed(3)}</span>
          </div>
          <div className="score-detail">
            <span className="detail-label">Data Points:</span>
            <span className="detail-value">{dataPoints} days</span>
          </div>
          <div className="score-explanation">
            <p>
              Lower average correlation indicates better diversification. 
              A score of 100 means holdings are completely uncorrelated (ideal), 
              while a score of 0 means holdings move together (high risk).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

