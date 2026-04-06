import "../styles/Score.css";

const Score = ({ data, productName, mode }) => {
  // data = { carbon: "0.718", score: 93, verdict: "SUSTAINABLE" }

  const getVerdictStyle = (verdict) => {
    switch (verdict) {
      case "SUSTAINABLE": return { color: "#00ff88", shadow: "rgba(0, 255, 136, 0.3)" };
      case "MODERATE": return { color: "#f2ff00", shadow: "rgba(242, 255, 0, 0.3)" };
      default: return { color: "#ff0055", shadow: "rgba(255, 0, 85, 0.3)" };
    }
  };

  const style = getVerdictStyle(data.verdict);

  return (
    <div className="score-container">
      <div className="score-header">
        <span className="tiny-label highlight">ANALYSIS_MODE // {mode.toUpperCase()}</span>
        <h2 className="product-title">{productName || "GENERIC_PROTOTYPE"}</h2>
      </div>

      <div className="gauge-wrapper">
        <div 
          className="score-gauge" 
          style={{ borderColor: style.color, boxShadow: `inset 0 0 20px ${style.shadow}` }}
        >
          <span className="label">ECO_SCORE</span>
          <h1 className="score-value" style={{ color: style.color }}>{data.score}</h1>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="label">CARBON_ESTIMATE</span>
          <p className="value highlight">{data.carbon} <small>kg/CO2</small></p>
        </div>
        
        <div className="metric-card">
          <span className="label">SYSTEM_VERDICT</span>
          <p className="value" style={{ color: style.color }}>{data.verdict}</p>
        </div>
      </div>

      <div className="data-integrity">
        <p className="small-text">
          // PROOF_OF_SUSTAINABILITY: {data.score > 70 ? "CERTIFIED" : "PENDING"}
        </p>
      </div>
    </div>
  );
};

export default Score;
