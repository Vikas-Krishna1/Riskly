import './CorrelationAnalysis.css';

interface CorrelationData {
  symbol: string;
  [key: string]: string | number;
}

interface CorrelationMatrixProps {
  symbols: string[];
  correlationMatrix: CorrelationData[];
}

export default function CorrelationMatrix({ symbols, correlationMatrix }: CorrelationMatrixProps) {
  const getCorrelationColor = (value: number): string => {
    // Map correlation value (-1 to 1) to color gradient
    // Red for positive correlation, blue for negative
    const absValue = Math.abs(value);
    if (value > 0) {
      // Positive correlation: light red to dark red
      const intensity = Math.floor(absValue * 255);
      return `rgb(${255}, ${255 - intensity}, ${255 - intensity})`;
    } else {
      // Negative correlation: light blue to dark blue
      const intensity = Math.floor(absValue * 255);
      return `rgb(${255 - intensity}, ${255 - intensity}, ${255})`;
    }
  };

  const getCorrelationTextColor = (value: number): string => {
    const absValue = Math.abs(value);
    return absValue > 0.5 ? 'white' : '#1f2937';
  };

  return (
    <div className="correlation-matrix-container">
      <h3>Correlation Matrix</h3>
      <p className="matrix-description">
        Correlation values range from -1 (perfect negative) to +1 (perfect positive). 
        Values closer to +1 indicate holdings move together, while values closer to -1 indicate opposite movements.
      </p>
      <div className="correlation-matrix">
        <table className="correlation-table">
          <thead>
            <tr>
              <th></th>
              {symbols.map((symbol) => (
                <th key={symbol}>{symbol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlationMatrix.map((row, rowIndex) => (
              <tr key={row.symbol}>
                <td className="row-header">{row.symbol}</td>
                {symbols.map((symbol) => {
                  const value = typeof row[symbol] === 'number' ? row[symbol] as number : parseFloat(row[symbol] as string) || 0;
                  return (
                    <td
                      key={symbol}
                      className="correlation-cell"
                      style={{
                        backgroundColor: getCorrelationColor(value),
                        color: getCorrelationTextColor(value),
                      }}
                      title={`${row.symbol} vs ${symbol}: ${value.toFixed(3)}`}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="correlation-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'rgb(255, 0, 0)' }}></span>
          <span>High Positive Correlation (+1.0)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'rgb(255, 255, 255)' }}></span>
          <span>No Correlation (0.0)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'rgb(0, 0, 255)' }}></span>
          <span>High Negative Correlation (-1.0)</span>
        </div>
      </div>
    </div>
  );
}

