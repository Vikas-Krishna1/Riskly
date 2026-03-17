export interface AIAnalysisResponse {
  portfolioName: string;
  analysis: {
    overallAssessment: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: Recommendation[];
    riskConsiderations: string[];
  };
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  rationale: string;
}

export interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
}

