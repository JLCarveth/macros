-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram GIN index on nutrition_records.name for fast ILIKE searches
CREATE INDEX idx_nutrition_records_name_trgm ON nutrition_records USING gin (name gin_trgm_ops);
