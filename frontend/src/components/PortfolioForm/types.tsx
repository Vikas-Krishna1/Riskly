// types.ts - Portfolio and Holding types

// ========== PORTFOLIO TYPES ==========
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  holdings: Holding[];
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioCreate {
  name: string;
  description?: string;
}

export interface PortfolioUpdate {
  name?: string;
  description?: string;
}

// ========== HOLDING TYPES ==========
export interface Holding {
  id: string;
  symbol: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
  // These fields might come from other API calls, so they are optional
  currentPrice?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HoldingCreate {
  symbol: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string; // Should be in 'YYYY-MM-DD' format
}

export interface HoldingAdd {
  symbol: string;
  shares: number;
  purchaseDate?: string; // Should be in 'YYYY-MM-DD' format
}

export interface HoldingUpdate {
  symbol?: string;
  shares?: number;
  purchasePrice?: number;
  purchaseDate?: string;
}

// ========== API ERROR TYPE ==========
export interface ApiError {
  detail: string;
}