-- Migration: 002_create_nutrition_records
-- Description: Create nutrition_records table for storing scanned/manual food entries

CREATE TABLE IF NOT EXISTS nutrition_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    serving_size_value DECIMAL(10, 2) NOT NULL,
    serving_size_unit VARCHAR(10) NOT NULL CHECK (serving_size_unit IN ('g', 'ml')),
    calories DECIMAL(10, 2) NOT NULL,
    total_fat DECIMAL(10, 2),
    carbohydrates DECIMAL(10, 2),
    fiber DECIMAL(10, 2),
    sugars DECIMAL(10, 2),
    protein DECIMAL(10, 2),
    cholesterol DECIMAL(10, 2),
    sodium DECIMAL(10, 2),
    upc_code VARCHAR(20),
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'scan', 'api')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_records_user_id ON nutrition_records(user_id);

-- Index for UPC code lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_records_upc ON nutrition_records(upc_code) WHERE upc_code IS NOT NULL;

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_nutrition_records_name ON nutrition_records(user_id, name);
