// types.ts - Portfolio types
export interface Portfolio {
  id: string;
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

export interface ApiError {
  detail: string;
}