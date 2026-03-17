import { AIAnalysisResponse } from './types';
import RecommendationCard from './RecommendationCard';
import './AIAnalysisModal.css';

interface AIAnalysisContentProps {
  analysis: AIAnalysisResponse['analysis'];
}

export default function AIAnalysisContent({ analysis }: AIAnalysisContentProps) {
  return (
    <div className="ai-analysis-content">
      {/* Overall Assessment */}
      <section className="analysis-section">
        <h3 className="section-title">
          <span className="section-icon">📊</span>
          Overall Assessment
        </h3>
        <p className="assessment-text">{analysis.overallAssessment}</p>
      </section>

      {/* Strengths and Weaknesses */}
      <div className="strengths-weaknesses-grid">
        <section className="analysis-section">
          <h3 className="section-title">
            <span className="section-icon">✅</span>
            Strengths
          </h3>
          <ul className="analysis-list strengths-list">
            {analysis.strengths.length > 0 ? (
              analysis.strengths.map((strength, index) => (
                <li key={index} className="analysis-list-item">
                  {strength}
                </li>
              ))
            ) : (
              <li className="analysis-list-item empty">No strengths identified</li>
            )}
          </ul>
        </section>

        <section className="analysis-section">
          <h3 className="section-title">
            <span className="section-icon">⚠️</span>
            Weaknesses
          </h3>
          <ul className="analysis-list weaknesses-list">
            {analysis.weaknesses.length > 0 ? (
              analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="analysis-list-item">
                  {weakness}
                </li>
              ))
            ) : (
              <li className="analysis-list-item empty">No weaknesses identified</li>
            )}
          </ul>
        </section>
      </div>

      {/* Recommendations */}
      <section className="analysis-section recommendations-section">
        <h3 className="section-title">
          <span className="section-icon">💡</span>
          Recommendations
        </h3>
        <div className="recommendations-grid">
          {analysis.recommendations.length > 0 ? (
            analysis.recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={index}
                recommendation={recommendation}
                index={index}
              />
            ))
          ) : (
            <p className="empty-message">No recommendations available</p>
          )}
        </div>
      </section>

      {/* Risk Considerations */}
      <section className="analysis-section">
        <h3 className="section-title">
          <span className="section-icon">⚠️</span>
          Risk Considerations
        </h3>
        <ul className="analysis-list risk-list">
          {analysis.riskConsiderations.length > 0 ? (
            analysis.riskConsiderations.map((risk, index) => (
              <li key={index} className="analysis-list-item">
                {risk}
              </li>
            ))
          ) : (
            <li className="analysis-list-item empty">No specific risk considerations</li>
          )}
        </ul>
      </section>
    </div>
  );
}

