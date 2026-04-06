# EcoScore Backend API

FastAPI backend for EcoScore application with OpenRouter AI integration.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Edit the `.env` file and add your OpenRouter API key:
```
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
```

Get your API key from: https://openrouter.ai/keys

### 3. Run the Server
```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### Search Products
- **POST** `/api/search-products`
- **Query Params:** `query`, `limit`
- **Response:** List of products with eco scores

### Get Alternatives
- **POST** `/api/get-alternatives`
- **Body:** `{"product_name": "...", "product_category": "..."}`
- **Response:** List of eco-friendly alternatives

### Calculate Total Score
- **POST** `/api/calculate-total-score`
- **Body:** `{"products": [...]}`
- **Response:** Total eco score for multiple products

## Features

- **AI-Powered Search**: Uses OpenRouter to find real products
- **Eco Score Calculation**: Automatic scoring based on environmental factors
- **Alternative Suggestions**: Finds sustainable alternatives with carbon savings
- **CORS Enabled**: Works with frontend on localhost:5173

## Frontend Integration

The frontend (running on `http://localhost:5173`) will automatically connect to this backend for:
- Product search with dropdown suggestions
- Real-time eco score calculation
- Better alternatives recommendations

## Development

The backend uses:
- **FastAPI**: Modern Python web framework
- **OpenRouter**: AI API for product search and alternatives
- **Pydantic**: Data validation
- **CORS**: Cross-origin resource sharing for frontend
