import "../styles/Simulator.css";

const Simulator = ({ currentResults, baselineCarbon }) => {
  // 1. Calculate Improvement %
  // Formula: ((Carbon_old - Carbon_new) / Carbon_old) * 100
  const current = parseFloat(currentResults.carbon);
  const baseline = parseFloat(baselineCarbon);
  
  const diff = baseline - current;
  const improvementPct = baseline > 0 ? ((diff / baseline) * 100).toFixed(1) : 0;
  const isPositive = diff >= 0;

  return (
    <div className="simulator-container">
      <div className="sim-header">
        <h2 className="highlight">OPTIMIZATION_LAB</h2>
        <p className="small-text">// ANALYZING_DECISION_IMPACT</p>
      </div>

      <div className="comparison-card">
        <div className="box">
          <span className="label">BASELINE</span>
          <p className="val">{baseline.toFixed(3)}</p>
        </div>
        <div className="arrow">→</div>
        <div className="box">
          <span className="label">OPTIMIZED</span>
          <p className="val highlight">{current.toFixed(3)}</p>
        </div>
      </div>

      <div className={`impact-ribbon ${isPositive ? 'gain' : 'loss'}`}>
        <span className="label">NET_IMPACT</span>
        <h3>{isPositive ? '+' : ''}{improvementPct}%</h3>
      </div>

      <div className="investor-metrics">
        <p className="section-tag highlight">INVESTOR_INSIGHTS</p>
        <div className="insight-row">
          <span>SCALABLE_SAVINGS:</span>
          <span className="highlight">{diff.toFixed(3)} units/pc</span>
        </div>
        <div className="insight-row">
          <span>FUNDING_VIABILITY:</span>
          <span style={{ color: currentResults.score > 70 ? '#00ff88' : '#ff0055' }}>
            {currentResults.score > 70 ? 'OPTIMAL' : 'REJECTED'}
          </span>
        </div>
      </div>

      <div className="optimization-engine">
        <p className="small-text">// SYSTEM_SUGGESTION:</p>
        <p className="suggestion">
          {diff <= 0 
            ? "Current configuration exceeds baseline. Revert transport or material changes." 
            : "Optimization detected. This configuration improves trust for Series A funding."}
        </p>
      </div>
    </div>
  );
};

export default Simulator;
