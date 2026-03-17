// types.tsx - HoldingForm specific types

// Re-export relevant types from PortfolioForm for convenience
export type { Holding, HoldingAdd, HoldingUpdate } from '../PortfolioForm/types';

// HoldingForm specific types
export interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export interface HoldingFormProps {
  portfolioId: string;
  onSuccess?: () => void;
}

