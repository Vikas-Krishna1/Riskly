import './PriceChangeIndicator.css';

interface PriceChangeIndicatorProps {
  change: number;
  changePercent?: number;
  showPercent?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function PriceChangeIndicator({
  change,
  changePercent,
  showPercent = true,
  size = 'medium',
}: PriceChangeIndicatorProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  if (isNeutral) {
    return null;
  }

  const arrow = isPositive ? '↑' : '↓';
  const colorClass = isPositive ? 'positive' : 'negative';
  const sizeClass = `indicator-${size}`;

  return (
    <span className={`price-change-indicator ${colorClass} ${sizeClass}`}>
      <span className="arrow">{arrow}</span>
      {showPercent && changePercent !== undefined && (
        <span className="percent">
          {Math.abs(changePercent).toFixed(2)}%
        </span>
      )}
    </span>
  );
}

