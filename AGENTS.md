# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nutrition Llama - A full-stack nutrition tracking application with:
- **Backend API** (`packages/api`) - Node.js nutrition analyzer using vision LLM via OpenAI-compatible API
- **Frontend** (`packages/web`) - Deno Fresh 2.0 web application
- **Shared Types** (`packages/shared`) - Common TypeScript types

## Commands

```bash
# Run development servers
deno task dev:api          # Start API server (port 3000)
deno task dev:web          # Start Fresh frontend (port 8000)

# Run database migrations
deno task migrate          # Apply pending migrations

# Package-specific commands
cd packages/api && deno task dev   # API with Deno
cd packages/api && npm run dev     # API with Node.js
cd packages/web && deno task dev   # Fresh frontend

# Install dependencies (for Node.js)
npm install                # Root workspace
```

Note: No test suite is configured yet.

## Architecture

### Monorepo Structure
```
nutrition-llama/
├── packages/
│   ├── api/                 # Nutrition analyzer API
│   │   └── src/app.js       # Express server with vision LLM
│   ├── web/                 # Deno Fresh frontend
│   │   ├── routes/          # Pages and API routes
│   │   ├── islands/         # Interactive components
│   │   └── utils/           # DB and auth utilities
│   └── shared/              # Shared TypeScript types
├── migrations/              # PostgreSQL migrations
└── scripts/                 # Utility scripts
```

### API Package (`packages/api`)

Processing pipeline:
1. **Image Upload** - Multer handles multipart form data (memory storage)
2. **Vision LLM** - Image sent to OpenAI-compatible API (e.g., OpenAI, LM Studio, Ollama) for direct nutrition extraction

The API uses any OpenAI-compatible vision model to directly analyze nutrition label images without OCR. This provides better accuracy since the model can understand table structure and spatial layout.

Endpoints:
- `GET /version` - Returns package version
- `POST /analyze-nutrition` - Accepts `image` file upload, returns structured JSON nutrition data

### Web Package (`packages/web`)
- **Framework**: Deno Fresh 2.0 with Preact
- **Styling**: TailwindCSS
- **Auth**: JWT with HTTP-only cookies (15min access, 7-day refresh)
- **Database**: PostgreSQL via deno-postgres

### Shared Package (`packages/shared`)
- Type definitions for nutrition data, users, and food logs

## Database

PostgreSQL with three main tables:
- `users` - User accounts with password hashes
- `nutrition_records` - Saved food items with nutrition data
- `food_log` - Daily food consumption entries

### Initial Database Setup

Before running migrations for the first time, create the database and user:

```sql
-- Connect to PostgreSQL as a superuser (e.g., postgres)
-- psql -U postgres

-- Create the application user
CREATE USER nutrition_llama WITH PASSWORD 'your_secure_password';

-- Create the database
CREATE DATABASE nutrition_llama OWNER nutrition_llama;

-- Grant privileges (connect to the new database first)
-- \c nutrition_llama
GRANT ALL PRIVILEGES ON DATABASE nutrition_llama TO nutrition_llama;
```

Or as a one-liner from the command line:

```bash
# Create user and database
sudo -u postgres psql -c "CREATE USER nutrition_llama WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE nutrition_llama OWNER nutrition_llama;"
```

Then run migrations: `deno task migrate`

## Environment Variables

### Database Connection (preferred)

Use individual PostgreSQL environment variables:
```bash
PGHOST=localhost
PGPORT=5432
PGUSER=nutrition_llama
PGPASSWORD=your_secure_password
PGDATABASE=nutrition_llama
```

Alternatively, use a connection string (fallback):
```bash
DATABASE_URL=postgresql://nutrition_llama:your_secure_password@localhost:5432/nutrition_llama
```

### Application Secrets

Required in `.env`:
```bash
ACCESS_TOKEN_SECRET=<32-byte-secret>
REFRESH_TOKEN_SECRET=<32-byte-secret>
NUTRITION_API_URL=http://localhost:3000
```

### API-specific

LLM API configuration (required):
```bash
LLM_API_URL=http://localhost:1234/v1   # OpenAI-compatible API endpoint
LLM_API_KEY=lm-studio                   # API key (use "lm-studio" for LM Studio)
LLM_MODEL=gpt-4o-mini                   # Model name (must support vision)
```

Other options:
- `PORT` - Server port (default: 3000)
- `LOG_TIMINGS` - Set to "true" to enable performance logging

## Key User Flows

1. **Scan Label**: Camera capture -> POST /api/analyze -> Save to nutrition_records
2. **Log Food**: Select saved food -> Add to food_log with servings/meal type
3. **Daily Summary**: View aggregated macros for any date

## Notes

- Fresh generates `fresh.gen.ts` - this file should be committed
- API requires Node.js 18+ for native fetch support
- For local development, use LM Studio with a vision model (e.g., LLaVA, Qwen-VL)
