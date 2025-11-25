import { useState, useEffect, useRef, useCallback } from 'react';
import { portfolioService } from '../components/PortfolioForm/portfolioService';

interface PortfolioAnalytics {
  portfolioName: string;
  totalPortfolioValue: number;
  analytics: {
    dailyReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    sortinoRatio: number;
    calmarRatio: number;
    totalReturn: number;
    annualizedReturn: number;
    winRate: number;
    concentration: number;
    valueAtRisk: number;
    expectedShortfall: number;
    beta: number;
    alpha: number;
    informationRatio: number;
    treynorRatio: number;
  };
  holdings: {
    symbol: string;
    shares: number;
    purchasePrice: number;
    currentPrice: number;
    currentValue: number;
    purchaseValue: number;
    gainLoss: number;
  }[];
  historicalValue: {
    Date: string;
    Total: number;
  }[];
  benchmarks?: {
    [key: string]: {
      name: string;
      totalReturn: number;
      annualizedReturn: number;
      volatility: number;
      historicalValue: {
        Date: string;
        Value: number;
      }[];
    };
  };
  benchmarkComparison?: {
    [key: string]: {
      name: string;
      outperformance: number;
      totalOutperformance: number;
      benchmarkReturn: number;
      benchmarkAnnualizedReturn: number;
    };
  };
  bestHolding?: {
    symbol: string;
    gainLoss: number;
    gainLossPercent: number;
  };
  worstHolding?: {
    symbol: string;
    gainLoss: number;
    gainLossPercent: number;
  };
}

interface UseRealtimeAnalyticsOptions {
  portfolioId: string | null;
  enabled?: boolean;
  interval?: number; // in milliseconds, default 60 seconds
  onUpdate?: (analytics: PortfolioAnalytics) => void;
}

interface PriceChange {
  symbol: string;
  previousValue: number;
  currentValue: number;
  change: number;
  changePercent: number;
}

export function useRealtimeAnalytics({
  portfolioId,
  enabled = true,
  interval = 3000, // 3 seconds for real-time updates
  onUpdate,
}: UseRealtimeAnalyticsOptions) {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceChanges, setPriceChanges] = useState<Map<string, PriceChange>>(new Map());
  const previousAnalyticsRef = useRef<PortfolioAnalytics | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!portfolioId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await portfolioService.getAnalytics(portfolioId);
      
      // Calculate price changes only if we have previous data
      if (previousAnalyticsRef.current) {
        const changes = new Map<string, PriceChange>();
        
        // Compare portfolio total value
        const prevTotal = previousAnalyticsRef.current.totalPortfolioValue;
        const currentTotal = data.totalPortfolioValue;
        const totalChange = currentTotal - prevTotal;
        const totalChangePercent = prevTotal > 0 ? (totalChange / prevTotal) * 100 : 0;
        
        // Only show change if it's significant (more than 0.01% to avoid noise)
        if (Math.abs(totalChangePercent) > 0.01) {
          changes.set('PORTFOLIO_TOTAL', {
            symbol: 'PORTFOLIO_TOTAL',
            previousValue: prevTotal,
            currentValue: currentTotal,
            change: totalChange,
            changePercent: totalChangePercent,
          });
        }

        // Compare individual holdings
        data.holdings.forEach((holding) => {
          const prevHolding = previousAnalyticsRef.current?.holdings.find(
            h => h.symbol === holding.symbol
          );
          if (prevHolding) {
            const valueChange = holding.currentValue - prevHolding.currentValue;
            const valueChangePercent = prevHolding.currentValue > 0 
              ? (valueChange / prevHolding.currentValue) * 100 
              : 0;
            
            // Only show change if it's significant (more than 0.1% to avoid noise)
            if (Math.abs(valueChangePercent) > 0.1) {
              changes.set(holding.symbol, {
                symbol: holding.symbol,
                previousValue: prevHolding.currentValue,
                currentValue: holding.currentValue,
                change: valueChange,
                changePercent: valueChangePercent,
              });
            }
          }
        });

        if (changes.size > 0) {
          setPriceChanges(changes);
        }
      }
      
      // Always update previous analytics for next comparison
      previousAnalyticsRef.current = data;

      // Always update analytics state
      setAnalytics(data);
      
      if (onUpdate) {
        onUpdate(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [portfolioId, enabled, onUpdate]);

  useEffect(() => {
    if (!portfolioId || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear analytics when disabled
      if (!enabled) {
        setAnalytics(null);
      }
      return;
    }

    // Initial fetch immediately when enabled
    fetchAnalytics();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchAnalytics();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [portfolioId, enabled, interval, fetchAnalytics]);

  // Clear price changes after 3 seconds
  useEffect(() => {
    if (priceChanges.size > 0) {
      const timer = setTimeout(() => {
        setPriceChanges(new Map());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [priceChanges]);

  return {
    analytics,
    loading,
    error,
    priceChanges,
    refetch: fetchAnalytics,
  };
}

