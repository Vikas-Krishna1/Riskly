// portfolioService.ts - API service for portfolio operations
import { Portfolio, PortfolioCreate, PortfolioUpdate, ApiError } from './types';

const API_BASE_URL = 'http://localhost:8000/portfolios';

class PortfolioService {
  /**
   * Fetch all portfolios
   */
  async getAll(): Promise<Portfolio[]> {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to fetch portfolios');
    }
    
    return response.json();
  }

  /**
   * Fetch a single portfolio by ID
   */
  async getById(id: string): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to fetch portfolio');
    }
    
    return response.json();
  }

  /**
   * Create a new portfolio
   */
  async create(data: PortfolioCreate): Promise<Portfolio> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to create portfolio');
    }
    
    return response.json();
  }

  /**
   * Update an existing portfolio
   */
  async update(id: string, data: PortfolioUpdate): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to update portfolio');
    }
    
    return response.json();
  }

  /**
   * Delete a portfolio
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Failed to delete portfolio');
    }
  }
}

// Export a singleton instance
export const portfolioService = new PortfolioService();