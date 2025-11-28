// portfolioService.ts - API service for portfolio operations
import { Portfolio, PortfolioCreate, PortfolioUpdate, Holding, HoldingAdd, HoldingUpdate } from './types';
import apiClient from '../../api/axios';

class PortfolioService {
  /**
   * Fetch all portfolios
   */
  async getCurrentUser(): Promise<{ id: string; username: string }> {
    const response = await apiClient.get('/users/me');
    return response.data;
  }

  /**
   * Fetch all portfolios for the current user
   */
  async getAll(): Promise<Portfolio[]> {
    // First, get the current user's ID
    const user = await this.getCurrentUser();
    
    // Then fetch their portfolios
    const response = await apiClient.get(`/portfolios/user/${user.id}`);
    return response.data;
  }

  /**
   * Fetch a single portfolio by ID
   */
  async getById(id: string): Promise<Portfolio> {
    const response = await apiClient.get(`/portfolios/${id}`);
    return response.data;
  }

  /**
   * Create a new portfolio
   */
  async create(data: PortfolioCreate): Promise<Portfolio> {
    const response = await apiClient.post('/portfolios', data);
    return response.data;
  }

  /**
   * Add a holding to an existing portfolio
   */
  async addHolding(portfolioId: string, data: HoldingAdd): Promise<Holding> {
    const response = await apiClient.post(`/portfolios/${portfolioId}/holdings`, data);
    // The backend returns { message, added }
    return response.data.added;
  }

  /**
   * Update an existing holding in a portfolio
   */
  async updateHolding(portfolioId: string, holdingId: string, data: HoldingUpdate): Promise<Holding> {
    const response = await apiClient.put(`/portfolios/${portfolioId}/holdings/${holdingId}`, data);
    // The backend returns { message, updated }
    return response.data.updated;
  }

  /**
   * Delete a holding from a portfolio
   */
  async deleteHolding(portfolioId: string, holdingId: string): Promise<void> {
    await apiClient.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
  }

  /**
   * Update an existing portfolio
   */
  async update(id: string, data: PortfolioUpdate): Promise<Portfolio> {
    const response = await apiClient.put(`/portfolios/${id}`, data);
    return response.data;
  }

  /**
   * Delete a portfolio
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/portfolios/${id}`);
  }

  /**
   * Fetch analytics for a single portfolio by ID
   */
  async getAnalytics(id: string): Promise<any> { 
    const response = await apiClient.get(`/analytics/${id}`);
    return response.data;
  }

  /**
   * Fetch AI analysis for a single portfolio by ID
   */
  async getAIAnalysis(id: string): Promise<any> {
    const response = await apiClient.get(`/ai-analysis/${id}`);
    return response.data;
  }

  /**
   * Compare multiple portfolios
   */
  async comparePortfolios(portfolioIds: string[]): Promise<any> {
    const response = await apiClient.get('/analytics/compare', {
      params: {
        portfolio_ids: portfolioIds.join(','),
      },
    });
    return response.data;
  }

  /**
   * Fetch transaction history for a portfolio
   */
  async getTransactions(
    portfolioId: string,
    filters?: {
      symbol?: string;
      transactionType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any[]> {
    const params: Record<string, string> = {};
    if (filters?.symbol) params.symbol = filters.symbol;
    if (filters?.transactionType) params.transaction_type = filters.transactionType;
    if (filters?.startDate) params.start_date = filters.startDate;
    if (filters?.endDate) params.end_date = filters.endDate;

    const response = await apiClient.get(`/transactions/portfolio/${portfolioId}`, {
      params,
    });
    return response.data;
  }
}

// Export a singleton instance
export const portfolioService = new PortfolioService();