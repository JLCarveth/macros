-- Migration: 007_create_community_foods
-- Description: Create community_foods table and extend nutrition_records source constraint

-- Extend the source CHECK constraint on nutrition_records to allow new values
ALTER TABLE nutrition_records DROP CONSTRAINT IF EXISTS nutrition_records_source_check;
ALTER TABLE nutrition_records ADD CONSTRAINT nutrition_records_source_check
    CHECK (source IN ('manual', 'scan', 'api', 'openfoodfacts', 'community'));

-- Community foods table: shared pool of user-contributed UPC foods
CREATE TABLE IF NOT EXISTS community_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    upc_code VARCHAR(20) NOT NULL,
    contributed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    off_product_url VARCHAR(512),
    verified_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique index on UPC code (one community entry per barcode)
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_foods_upc ON community_foods(upc_code);

-- Trigram GIN index on name for ILIKE search (matches pattern from migration 004)
CREATE INDEX IF NOT EXISTS idx_community_foods_name_trgm ON community_foods USING gin (name gin_trgm_ops);

-- Updated_at trigger using existing function from migration 001
DROP TRIGGER IF EXISTS update_community_foods_updated_at ON community_foods;
CREATE TRIGGER update_community_foods_updated_at
    BEFORE UPDATE ON community_foods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
