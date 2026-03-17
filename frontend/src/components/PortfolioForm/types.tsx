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
  isPublic?: boolean;
  shareToken?: string;
  ownerUsername?: string;
  ownerDisplayName?: string;
}

export interface PortfolioCreate {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface PortfolioUpdate {
  name?: string;
  description?: string;
  isPublic?: boolean;
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

// ========== PORTFOLIO SHARING TYPES ==========
export interface PortfolioShare {
  shareToken: string;
  isPublic: boolean;
  shareUrl: string;
}

export interface PublicPortfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  holdings: Holding[];
  createdAt: string;
  ownerUsername?: string;
  ownerDisplayName?: string;
}

// ========== PROFILE TYPES ==========
export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  theme?: string;
  profilePrivacy?: string;
}

export interface ProfileUpdate {
  avatar?: string;
  bio?: string;
  displayName?: string;
  theme?: 'light' | 'dark' | 'auto';
  profilePrivacy?: 'public' | 'private';
}

// ========== API ERROR TYPE ==========
export interface ApiError {
  detail: string;
}