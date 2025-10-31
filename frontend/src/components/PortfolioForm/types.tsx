// types.ts - Portfolio and Holding types

// ========== PORTFOLIO TYPES ==========
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
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
  portfolio_id: string;
  ticker: string;
  shares: number;
  purchase_price: number;
  purchase_date: string;
  current_price?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HoldingCreate {
  ticker: string;
  shares: number;
  purchase_price: number;
  purchase_date: string;
  notes?: string;
}

export interface HoldingUpdate {
  shares?: number;
  purchase_price?: number;
  purchase_date?: string;
  notes?: string;
}

// ========== API ERROR TYPE ==========
export interface ApiError {
  detail: string;
}