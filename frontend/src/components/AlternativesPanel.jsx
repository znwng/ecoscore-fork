import { useState, useEffect } from "react";
import "../styles/AlternativesPanel.css";

const API_BASE_URL = "http://localhost:8000";

// Add cache-busting timestamp
const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}?_t=${Date.now()}`;

const AlternativesPanel = ({ foundProducts, setFoundProducts }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch alternatives when products change
  useEffect(() => {
    if (foundProducts.length > 0) {
      const lastProduct = foundProducts[foundProducts.length - 1];
      fetchAlternatives(lastProduct.name, lastProduct.category || 'general');
    } else {
      setAlternatives([]);
    }
  }, [foundProducts]);

  const fetchAlternatives = async (productName, productCategory = 'general') => {
    setIsLoading(true);
    console.log("Fetching alternatives for:", productName, productCategory); // Debug line
    try {
      const response = await fetch(getApiUrl("/api/get-alternatives"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_name: productName,
          product_category: productCategory
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Alternatives API Response:", data); // Debug line
        setAlternatives(data.alternatives || []);
      } else {
        console.error("Alternatives fetch failed:", response.status);
        // Add fallback alternatives for testing
        setAlternatives([
          {
            name: "Eco Alternative 1",
            reason: "This is a sustainable alternative",
            carbon_change: -5.0,
            score: 85,
            carbon: 10.0,
            verdict: "SUSTAINABLE"
          },
          {
            name: "Eco Alternative 2", 
            reason: "Better for the environment",
            carbon_change: -3.5,
            score: 78,
            carbon: 12.5,
            verdict: "MODERATE"
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching alternatives:", error);
      // Add fallback alternatives for testing
      setAlternatives([
        {
          name: "Local Alternative",
          reason: "Test alternative - please check API",
          carbon_change: -2.0,
          score: 72,
          carbon: 15.0,
          verdict: "MODERATE"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlternative = (alternative) => {
    console.log("Adding alternative:", alternative); // Debug line
    setSelectedProduct(alternative);
    setShowDialog(true);
  };

  const confirmAddAlternative = (action) => {
    console.log("Confirm add alternative:", action, selectedProduct); // Debug line
    const newProduct = {
      id: Date.now() + Math.random(), // Ensure unique ID
      name: selectedProduct.name,
      score: selectedProduct.score,
      carbon: selectedProduct.carbon,
      verdict: selectedProduct.verdict,
      category: foundProducts.length > 0 ? foundProducts[foundProducts.length - 1].category : 'general'
    };

    if (action === 'replace' && foundProducts.length > 0) {
      // Replace the last product
      setFoundProducts(prev => [...prev.slice(0, -1), newProduct]);
    } else {
      // Add separately
      setFoundProducts(prev => [...prev, newProduct]);
    }

    setShowDialog(false);
    setSelectedProduct(null);
  };

  return (
    <div className="alternatives-panel">
      <h2 className="panel-title">BETTER_ALTERNATIVES</h2>
      
      {foundProducts.length === 0 ? (
        <div className="no-products">
          <p className="info-text">Add products to see alternatives</p>
        </div>
      ) : isLoading ? (
        <div className="no-products">
          <p className="info-text">Finding alternatives...</p>
        </div>
      ) : alternatives.length === 0 ? (
        <div className="no-products">
          <p className="info-text">No alternatives found</p>
        </div>
      ) : (
        <div className="alternatives-list">
          {alternatives.map((alternative, index) => (
            <div key={index} className="alternative-item">
              <div className="alternative-info">
                <div className="alternative-name">{alternative.name}</div>
                <div className="alternative-reason">{alternative.reason}</div>
                <div className="alternative-stats">
                  <span className="score-badge">Score: {alternative.score}</span>
                  <span className={`carbon-change ${alternative.carbon_change < 0 ? 'negative' : 'positive'}`}>
                    {alternative.carbon_change < 0 ? '' : '+'}{alternative.carbon_change} kg CO2
                  </span>
                </div>
              </div>
              <button 
                className="add-alternative-btn"
                onClick={() => handleAddAlternative(alternative)}
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3 className="dialog-title">Add Alternative</h3>
            <p className="dialog-message">
              Do you want to add "{selectedProduct?.name}" separately or replace it?
            </p>
            <div className="dialog-buttons">
              <button 
                className="dialog-btn replace-btn"
                onClick={() => confirmAddAlternative('replace')}
              >
                REPLACE
              </button>
              <button 
                className="dialog-btn add-btn"
                onClick={() => confirmAddAlternative('add')}
              >
                ADD SEPARATELY
              </button>
              <button 
                className="dialog-btn cancel-btn"
                onClick={() => setShowDialog(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlternativesPanel;
