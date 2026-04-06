/**
 * Core Calculation Engine for ECOSCORE
 * Handles Carbon Estimation and EcoScore Generation
 */

export const calculateEcoScore = (inputs) => {
  // 1. Extract values (Ensuring they are floats for math)
  const category = parseFloat(inputs.categoryVal) || 0;
  const material = parseFloat(inputs.materialVal) || 0;
  const transport = parseFloat(inputs.transportVal) || 0;
  const packaging = parseFloat(inputs.packagingVal) || 0;

  // 2. Carbon Footprint Estimation
  // Formula: Carbon = w1-Category + w2-Material + w3-Transport + w4-Packaging
  // In API mode, weights are 1 as the values are already in kg/CO2
  const totalCarbon = category + material + transport + packaging;

  // 3. EcoScore Generation
  // Formula: EcoScore = 100 - (Carbon * k)
  // We use k=10 to scale decimal CO2 (e.g., 0.7kg -> 7 points off, 5kg -> 50 points off)
  const k = 10;
  let ecoScore = 100 - (totalCarbon * k);
  
  // Clamp score between 0 and 100
  ecoScore = Math.max(0, Math.min(100, Math.round(ecoScore)));

  // 4. Sustainability Verdict
  let verdict = "UNSUSTAINABLE";
  if (ecoScore >= 70) {
    verdict = "SUSTAINABLE";
  } else if (ecoScore >= 40) {
    verdict = "MODERATE";
  }

  return {
    carbon: totalCarbon.toFixed(3), // High precision for small changes
    score: ecoScore,
    verdict: verdict
  };
};
