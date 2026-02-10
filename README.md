# Nutrition Llama

A full-stack nutrition tracking application that uses vision LLMs to analyze nutrition labels from photos.

## Features

- **Vision-based Label Analysis**: Captures nutrition labels via camera and extracts data using OpenAI-compatible vision models
- **Food Logging**: Track daily food consumption with meal types and serving sizes
- **Daily Summaries**: View aggregated macronutrients for any date
- **User Accounts**: Secure authentication with JWT tokens

## Architecture

This is a monorepo with three packages:

```
nutrition-llama/
├── packages/
│   ├── api/      # Node.js nutrition analyzer API
│   ├── web/      # Deno Fresh 2.0 frontend
│   └── shared/   # Common TypeScript types
├── migrations/   # PostgreSQL migrations
└── scripts/      # Utility scripts
```

### API Package

Express server that accepts nutrition label images and returns structured JSON data. Uses any OpenAI-compatible vision model (OpenAI, LM Studio, Ollama, etc.) to directly analyze images without OCR.

### Web Package

Deno Fresh 2.0 application with Preact and TailwindCSS. Features camera capture, food logging, and daily tracking views.

## Prerequisites

- **Node.js** 18+ (for the API)
- **Deno** 2.0+ (for the web frontend)
- **PostgreSQL** database
- **OpenAI-compatible API** with a vision model (OpenAI, LM Studio, Ollama, etc.)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nutrition-llama
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL:**
   ```bash
   sudo -u postgres psql -c "CREATE USER nutrition_llama WITH PASSWORD 'your_password';"
   sudo -u postgres psql -c "CREATE DATABASE nutrition_llama OWNER nutrition_llama;"
   ```

4. **Configure environment variables:**

   Create a `.env` file:
   ```bash
   # Database
   PGHOST=localhost
   PGPORT=5432
   PGUSER=nutrition_llama
   PGPASSWORD=your_password
   PGDATABASE=nutrition_llama

   # Auth secrets (generate secure random values)
   ACCESS_TOKEN_SECRET=<32-byte-secret>
   REFRESH_TOKEN_SECRET=<32-byte-secret>

   # API URL for frontend
   NUTRITION_API_URL=http://localhost:3000

   # LLM Configuration
   LLM_API_URL=http://localhost:1234/v1   # OpenAI-compatible endpoint
   LLM_API_KEY=lm-studio                   # API key
   LLM_MODEL=gpt-4o-mini                   # Vision-capable model
   ```

5. **Run database migrations:**
   ```bash
   deno task migrate
   ```

## Usage

Start both development servers:

```bash
# Terminal 1 - API server (port 3000)
deno task dev:api

# Terminal 2 - Web frontend (port 8000)
deno task dev:web
```

Or run them individually:

```bash
cd packages/api && deno task dev    # API with Deno
cd packages/api && npm run dev      # API with Node.js
cd packages/web && deno task dev    # Frontend
```

### API Endpoints

- `GET /version` - Returns package version
- `POST /analyze-nutrition` - Accepts `image` file, returns structured nutrition JSON

Example:
```bash
curl -X POST -F "image=@/path/to/label.jpg" http://localhost:3000/analyze-nutrition
```

## Local LLM Setup

For local development without OpenAI, use [LM Studio](https://lmstudio.ai/) with a vision model:

1. Download and install LM Studio
2. Download a vision-capable model (e.g., LLaVA, Qwen-VL)
3. Start the local server (default: `http://localhost:1234/v1`)
4. Set `LLM_API_URL=http://localhost:1234/v1` and `LLM_API_KEY=lm-studio`

## License

MIT
