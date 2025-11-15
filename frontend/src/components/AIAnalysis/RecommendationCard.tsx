import { Recommendation } from './types';
import './AIAnalysisModal.css';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export default function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '•';
    }
  };

  return (
    <div className={`recommendation-card ${getPriorityColor(recommendation.priority)}`}>
      <div className="recommendation-header">
        <span className="recommendation-number">#{index + 1}</span>
        <span className="recommendation-priority">
          <span className="priority-icon">{getPriorityIcon(recommendation.priority)}</span>
          <span className="priority-text">{recommendation.priority.toUpperCase()}</span>
        </span>
        <span className="recommendation-category">{recommendation.category}</span>
      </div>
      <div className="recommendation-content">
        <h4 className="recommendation-action">{recommendation.action}</h4>
        <p className="recommendation-rationale">{recommendation.rationale}</p>
      </div>
    </div>
  );
}

