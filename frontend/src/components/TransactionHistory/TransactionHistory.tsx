import { useState, useEffect, useCallback } from 'react';
import { portfolioService } from '../PortfolioForm/portfolioService';
import './TransactionHistory.css';

interface Transaction {
  id: string;
  portfolioId: string;
  holdingId: string;
  transactionType: 'BUY' | 'SELL' | 'EDIT' | 'DELETE';
  symbol: string;
  shares: number;
  price: number;
  purchaseDate: string;
  previousShares?: number;
  previousPrice?: number;
  previousSymbol?: string;
  timestamp: string;
  notes?: string;
}

interface TransactionHistoryProps {
  portfolioId: string;
}

const TransactionHistory = ({ portfolioId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [symbolFilter, setSymbolFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = useCallback(async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filters: any = {};
      if (symbolFilter) filters.symbol = symbolFilter.toUpperCase();
      if (typeFilter) filters.transactionType = typeFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const data = await portfolioService.getTransactions(portfolioId, filters);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, symbolFilter, typeFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const clearFilters = () => {
    setSymbolFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'BUY':
        return '#4caf50';
      case 'SELL':
        return '#f44336';
      case 'EDIT':
        return '#ff9800';
      case 'DELETE':
        return '#9e9e9e';
      default:
        return '#2196f3';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const transactionCount = transactions.length;
  const hasActiveFilters = symbolFilter || typeFilter || startDate || endDate;

  return (
    <section className="transaction-history-section">
      <div 
        className="transaction-history-header-collapsible"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="transaction-header-content">
          <h2 className="transaction-section-title">Transaction History</h2>
          {!loading && (
            <span className="transaction-count-badge">
              {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
              {hasActiveFilters && ' (filtered)'}
            </span>
          )}
        </div>
        <button 
          className="transaction-toggle-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-expanded={isExpanded}
        >
          <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>

      {isExpanded && (
        <div className="transaction-history-content">
          {error && (
            <div className="transaction-error">Error: {error}</div>
          )}

          <div className="transaction-controls">
            <button 
              className="transaction-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '▼' : '▶'} Filters
            </button>
            <button 
              className="transaction-refresh-button" 
              onClick={fetchTransactions}
              title="Refresh transactions"
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          {showFilters && (
            <div className="transaction-filters">
              <div className="filter-group">
                <label htmlFor="symbol-filter">Symbol</label>
                <input
                  id="symbol-filter"
                  type="text"
                  placeholder="e.g., AAPL"
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="type-filter">Type</label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="BUY">Buy</option>
                  <option value="SELL">Sell</option>
                  <option value="EDIT">Edit</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="start-date">From</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="end-date">To</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              {hasActiveFilters && (
                <button 
                  className="clear-filters-button" 
                  onClick={clearFilters}
                  title="Clear all filters"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {loading && transactions.length === 0 ? (
            <div className="transaction-loading">Loading transaction history...</div>
          ) : transactions.length === 0 ? (
            <div className="no-transactions">
              {hasActiveFilters 
                ? 'No transactions match your filters.' 
                : 'No transactions yet. Transactions will appear here when you add, edit, or delete holdings.'}
            </div>
          ) : (
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Symbol</th>
                    <th>Shares</th>
                    <th>Price</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="transaction-row">
                      <td className="transaction-date">{formatDate(tx.timestamp)}</td>
                      <td>
                        <span 
                          className="transaction-type-badge"
                          style={{ backgroundColor: getTransactionTypeColor(tx.transactionType) }}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="transaction-symbol">{tx.symbol}</td>
                      <td>
                        {tx.transactionType === 'EDIT' && tx.previousShares !== undefined ? (
                          <span className="change-indicator">
                            {tx.previousShares} → {tx.shares}
                          </span>
                        ) : (
                          tx.shares
                        )}
                      </td>
                      <td>
                        {tx.transactionType === 'EDIT' && tx.previousPrice !== undefined ? (
                          <span className="change-indicator">
                            ${tx.previousPrice.toFixed(2)} → ${tx.price.toFixed(2)}
                          </span>
                        ) : (
                          `$${tx.price.toFixed(2)}`
                        )}
                      </td>
                      <td className="transaction-details">
                        {tx.transactionType === 'EDIT' && (
                          <div className="change-details-compact">
                            {tx.previousSymbol && tx.previousSymbol !== tx.symbol && (
                              <span className="change-tag">Symbol: {tx.previousSymbol}→{tx.symbol}</span>
                            )}
                            {tx.previousPrice !== undefined && tx.previousPrice !== tx.price && (
                              <span className="change-tag">Price updated</span>
                            )}
                          </div>
                        )}
                        {tx.transactionType === 'DELETE' && (
                          <span className="delete-indicator">Deleted</span>
                        )}
                        {tx.transactionType === 'BUY' && (
                          <span className="buy-indicator">Purchased {new Date(tx.purchaseDate).toLocaleDateString()}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TransactionHistory;

