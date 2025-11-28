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

  /**
   * Fetch portfolio health score
   */
  async getHealthScore(portfolioId: string): Promise<any> {
    const response = await apiClient.get(`/health-score/${portfolioId}`);
    return response.data;
  }

  /**
   * Fetch health score history
   */
  async getHealthScoreHistory(portfolioId: string, limit?: number): Promise<any> {
    const params: Record<string, string> = {};
    if (limit) params.limit = limit.toString();
    const response = await apiClient.get(`/health-score/${portfolioId}/history`, { params });
    return response.data;
  }

  /**
   * Get active alerts for current user
   */
  async getActiveAlerts(): Promise<any[]> {
    const response = await apiClient.get('/alerts/user/active');
    return response.data;
  }

  /**
   * Get alerts for a portfolio
   */
  async getPortfolioAlerts(portfolioId: string, enabledOnly?: boolean): Promise<any[]> {
    const params: Record<string, string> = {};
    if (enabledOnly) params.enabled_only = 'true';
    const response = await apiClient.get(`/alerts/portfolio/${portfolioId}`, { params });
    return response.data;
  }

  /**
   * Create an alert
   */
  async createAlert(alertData: any): Promise<any> {
    const response = await apiClient.post('/alerts', alertData);
    return response.data;
  }

  /**
   * Update an alert
   */
  async updateAlert(alertId: string, updateData: any): Promise<any> {
    const response = await apiClient.put(`/alerts/${alertId}`, updateData);
    return response.data;
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    await apiClient.delete(`/alerts/${alertId}`);
  }

  /**
   * Check alerts for a portfolio
   */
  async checkAlerts(portfolioId: string): Promise<any> {
    const response = await apiClient.post(`/alerts/check/${portfolioId}`);
    return response.data;
  }

  /**
   * Get target allocations for a portfolio
   */
  async getTargetAllocations(portfolioId: string): Promise<any> {
    const response = await apiClient.get(`/rebalancing/${portfolioId}/target-allocations`);
    return response.data;
  }

  /**
   * Set target allocations for a portfolio
   */
  async setTargetAllocations(portfolioId: string, allocationsData: any): Promise<any> {
    const response = await apiClient.post(`/rebalancing/${portfolioId}/target-allocations`, allocationsData);
    return response.data;
  }

  /**
   * Get rebalancing suggestions
   */
  async getRebalancingSuggestions(portfolioId: string, considerTolerance?: boolean): Promise<any> {
    const params: Record<string, string> = {};
    if (considerTolerance !== undefined) params.consider_tolerance = considerTolerance.toString();
    const response = await apiClient.get(`/rebalancing/${portfolioId}/suggestions`, { params });
    return response.data;
  }

  /**
   * Get correlation analysis for a portfolio
   */
  async getCorrelationAnalysis(portfolioId: string): Promise<any> {
    const response = await apiClient.get(`/correlation/${portfolioId}`);
    return response.data;
  }

  /**
   * Simulate a scenario for a portfolio
   */
  async simulateScenario(portfolioId: string, scenarioData: any): Promise<any> {
    const response = await apiClient.post(`/scenarios/${portfolioId}/simulate`, scenarioData);
    return response.data;
  }

  /**
   * Get predefined scenarios
   */
  async getPredefinedScenarios(): Promise<any> {
    const response = await apiClient.get('/scenarios/predefined');
    return response.data;
  }

  /**
   * Get tax optimization suggestions
   */
  async getTaxOptimization(portfolioId: string, taxRate?: number): Promise<any> {
    const params: Record<string, string> = {};
    if (taxRate !== undefined) params.tax_rate = taxRate.toString();
    const response = await apiClient.get(`/tax-optimization/${portfolioId}/suggestions`, { params });
    return response.data;
  }

  /**
   * Run backtest on a portfolio
   */
  async runBacktest(portfolioId: string, backtestData: any): Promise<any> {
    const response = await apiClient.post(`/backtesting/${portfolioId}/backtest`, backtestData);
    return response.data;
  }
}

// Export a singleton instance
export const portfolioService = new PortfolioService();