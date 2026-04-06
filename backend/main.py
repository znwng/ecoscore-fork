from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="EcoScore API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_SEARCH_API_KEY = os.getenv("OPENROUTER_SEARCH_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data models
class Product(BaseModel):
    name: str
    score: Optional[int] = None
    carbon: Optional[float] = None
    verdict: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

class AlternativesRequest(BaseModel):
    product_name: str
    product_category: str = "general"

class EcoScoreRequest(BaseModel):
    products: List[Product]

class EcoScoreResponse(BaseModel):
    products: List[Product]
    total_score: int
    total_carbon: float
    overall_verdict: str

# Helper functions
def calculate_eco_score(product_name: str, category: str = "general") -> dict:
    """Advanced eco score calculation based on multiple factors"""
    
    # Base scores by category
    category_baselines = {
        "electronics": {"min": 30, "max": 80, "avg_carbon": 25.0},
        "clothing": {"min": 40, "max": 85, "avg_carbon": 15.0},
        "food": {"min": 50, "max": 95, "avg_carbon": 8.0},
        "furniture": {"min": 25, "max": 75, "avg_carbon": 30.0},
        "general": {"min": 35, "max": 80, "avg_carbon": 20.0}
    }
    
    baseline = category_baselines.get(category.lower(), category_baselines["general"])
    
    # Scoring factors
    eco_positive_keywords = {
        "organic": 15, "recycled": 12, "sustainable": 10, "eco": 8, "green": 7,
        "bamboo": 10, "solar": 15, "wind": 12, "biodegradable": 8, "compostable": 8,
        "fair trade": 6, "local": 5, "natural": 4, "renewable": 10, "zero waste": 12
    }
    
    eco_negative_keywords = {
        "plastic": -10, "disposable": -12, "single-use": -15, "fast fashion": -8,
        "synthetic": -6, "artificial": -4, "chemical": -5, "toxic": -10,
        "polluting": -12, "wasteful": -8, "non-recyclable": -10, "hazardous": -15
    }
    
    # Start with baseline score
    score = (baseline["min"] + baseline["max"]) // 2
    carbon = baseline["avg_carbon"]
    
    # Analyze product name for keywords
    name_lower = product_name.lower()
    
    # Apply positive factors
    for keyword, points in eco_positive_keywords.items():
        if keyword in name_lower:
            score += points
            carbon *= 0.85  # 15% carbon reduction
    
    # Apply negative factors
    for keyword, points in eco_negative_keywords.items():
        if keyword in name_lower:
            score += points
            carbon *= 1.20  # 20% carbon increase
    
    # Brand-specific adjustments
    sustainable_brands = {
        "patagonia": 10, "allbirds": 8, "tentree": 12, "veja": 7,
        "fairphone": 15, "dell": 5, "hp": 4, "apple": 2, "samsung": 1,
        "nike": 0, "adidas": 1, "h&m": -5, "zara": -6, "shein": -10
    }
    
    for brand, points in sustainable_brands.items():
        if brand in name_lower:
            score += points
            if points > 0:
                carbon *= 0.9  # 10% reduction for sustainable brands
            else:
                carbon *= 1.1  # 10% increase for unsustainable brands
    
    # Material-based adjustments
    material_impacts = {
        "cotton": {"score": 2, "carbon": 1.1},
        "organic cotton": {"score": 8, "carbon": 0.7},
        "polyester": {"score": -5, "carbon": 1.3},
        "recycled polyester": {"score": 3, "carbon": 0.8},
        "aluminum": {"score": -3, "carbon": 1.2},
        "recycled aluminum": {"score": 6, "carbon": 0.6},
        "glass": {"score": 1, "carbon": 1.0},
        "recycled glass": {"score": 5, "carbon": 0.7},
        "steel": {"score": -4, "carbon": 1.4},
        "recycled steel": {"score": 4, "carbon": 0.8}
    }
    
    for material, impact in material_impacts.items():
        if material in name_lower:
            score += impact["score"]
            carbon *= impact["carbon"]
    
    # Ensure score stays within bounds
    score = max(0, min(100, score))
    
    # Ensure minimum carbon values
    carbon = max(1.0, carbon)
    
    # Determine verdict based on score
    if score >= 80:
        verdict = "SUSTAINABLE"
    elif score >= 60:
        verdict = "MODERATE"
    elif score >= 40:
        verdict = "CONCERNING"
    else:
        verdict = "UNSUSTAINABLE"
    
    return {
        "score": round(score),
        "carbon": round(carbon, 2),
        "verdict": verdict,
        "factors": {
            "category": category,
            "keywords_found": [k for k in eco_positive_keywords.keys() if k in name_lower] + 
                            [k for k in eco_negative_keywords.keys() if k in name_lower],
            "brand_adjustment": any(brand in name_lower for brand in sustainable_brands.keys())
        }
    }

async def call_openrouter(prompt: str, use_search_key: bool = False) -> str:
    """Call OpenRouter API for AI assistance"""
    # Choose appropriate API key
    api_key = OPENROUTER_SEARCH_API_KEY if use_search_key else OPENROUTER_API_KEY
    
    if not api_key:
        key_type = "search" if use_search_key else "alternatives"
        raise HTTPException(status_code=500, detail=f"OpenRouter {key_type} API key not configured")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "anthropic/claude-3-haiku",
        "messages": [
            {
                "role": "system",
                "content": "You are an environmental sustainability expert. Provide concise, accurate responses about products and their eco-friendly alternatives."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 1000,
        "temperature": 0.7
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OPENROUTER_URL, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenRouter API error: {str(e)}")

# API Endpoints
@app.get("/")
async def root():
    return {"message": "EcoScore API is running"}

@app.post("/test")
async def test_endpoint():
    return {"status": "ok", "message": "Backend is working"}

@app.post("/api/search-products")
async def search_products(request: SearchRequest):
    """Search for products using AI"""
    print(f"Received search request: {request}")  # Debug line
    if not request.query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    
    prompt = f"""You are a product search specialist with expertise in finding everyday consumer products and their environmental impact. Search for products related to: "{request.query}"

Use your knowledge to find real, specific products that consumers commonly purchase. For each product, provide accurate environmental scoring based on:
- Material composition and sustainability
- Manufacturing processes and carbon footprint
- Brand reputation for environmental responsibility
- Packaging and transportation impact
- Certifications (organic, fair trade, recycled content, etc.)

Return a JSON array of product objects with this exact structure:
[
    {{
        "name": "Specific Product Name with Brand",
        "category": "electronics|clothing|food|furniture|general",
        "environmental_notes": "Brief note on why this product's score"
    }},
    {{
        "name": "Another Specific Product",
        "category": "electronics|clothing|food|furniture|general", 
        "environmental_notes": "Environmental impact assessment"
    }}
]

Find exactly {request.limit} relevant products. Include both popular options and more sustainable alternatives when available. Be specific with brand names and product types.
Only return the JSON array, no other text or explanations.
"""
    
    try:
        response = await call_openrouter(prompt, use_search_key=True)  # Use search API key
        
        # Try to parse JSON response
        products = json.loads(response)
        
        # Calculate eco scores for each product
        scored_products = []
        for product in products:
            eco_data = calculate_eco_score(product["name"], product["category"])
            scored_products.append({
                "name": product["name"],
                "category": product["category"],
                "environmental_notes": product.get("environmental_notes", ""),
                **eco_data
            })
        
        return {"products": scored_products}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid response from AI service")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/get-alternatives")
async def get_alternatives(request: AlternativesRequest):
    """Get eco-friendly alternatives for a product"""
    if not request.product_name:
        raise HTTPException(status_code=400, detail="Product name is required")
    
    prompt = f"""You are a food health and environmental sustainability evaluator specializing in carbon footprint analysis. For the product "{request.product_name}" (category: {request.product_category}), suggest 3-4 more carbon-friendly and sustainable alternatives.

Return a JSON array with this exact structure:
[
    {{
        "name": "Alternative Product 1", 
        "reason": "Why it's more sustainable and carbon-friendly",
        "carbon_reduction": 5.2
    }},
    {{
        "name": "Alternative Product 2", 
        "reason": "Why it's more sustainable and carbon-friendly", 
        "carbon_reduction": 3.8
    }}
]

Focus on real, available products that are genuinely better for the environment. carbon_reduction should be in kg CO2 saved compared to the original product. Be specific about environmental benefits.
Only return the JSON array, no other text.
"""
    
    try:
        response = await call_openrouter(prompt)
        alternatives = json.loads(response)
        
        # Calculate eco scores for alternatives
        scored_alternatives = []
        original_eco = calculate_eco_score(request.product_name, request.product_category)
        
        for alt in alternatives:
            eco_data = calculate_eco_score(alt["name"], request.product_category)
            # Adjust carbon based on reduction
            eco_data["carbon"] = max(1.0, eco_data["carbon"] - alt["carbon_reduction"])
            scored_alternatives.append({
                "name": alt["name"],
                "reason": alt["reason"],
                "carbon_change": -alt["carbon_reduction"],  # Negative for reduction
                **eco_data
            })
        
        return {"alternatives": scored_alternatives}
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid response from AI service")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculate-product-score")
async def calculate_product_score(request: dict):
    """Calculate eco score for a manually added product"""
    product_name = request.get("product_name", "")
    category = request.get("category", "general")
    
    if not product_name:
        raise HTTPException(status_code=400, detail="Product name is required")
    
    # Use the advanced scoring algorithm
    eco_data = calculate_eco_score(product_name, category)
    
    return {
        "name": product_name,
        "category": category,
        "environmental_notes": "Manually added product - score calculated by algorithm",
        **eco_data
    }

@app.post("/api/calculate-total-score", response_model=EcoScoreResponse)
async def calculate_total_score(request: EcoScoreRequest):
    """Calculate total eco score for multiple products"""
    if not request.products:
        raise HTTPException(status_code=400, detail="Products list is required")
    
    total_score = 0
    total_carbon = 0.0
    scored_products = []
    
    for product in request.products:
        if product.score is None or product.carbon is None:
            # Calculate if not provided
            eco_data = calculate_eco_score(product.name)
            product.score = eco_data["score"]
            product.carbon = eco_data["carbon"]
            product.verdict = eco_data["verdict"]
        
        total_score += product.score
        total_carbon += product.carbon
        scored_products.append(product)
    
    # Calculate averages and overall verdict
    avg_score = total_score // len(request.products)
    avg_carbon = total_carbon / len(request.products)
    
    if avg_score >= 80:
        overall_verdict = "SUSTAINABLE"
    elif avg_score >= 60:
        overall_verdict = "MODERATE"
    else:
        overall_verdict = "UNSUSTAINABLE"
    
    return EcoScoreResponse(
        products=scored_products,
        total_score=avg_score,
        total_carbon=round(avg_carbon, 2),
        overall_verdict=overall_verdict
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
