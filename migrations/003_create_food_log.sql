-- Migration: 003_create_food_log
-- Description: Create food_log table for daily meal tracking

-- Create meal_type enum
DO $$ BEGIN
    CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Food log table
CREATE TABLE IF NOT EXISTS food_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nutrition_record_id UUID NOT NULL REFERENCES nutrition_records(id) ON DELETE CASCADE,
    servings DECIMAL(10, 2) NOT NULL DEFAULT 1.0 CHECK (servings > 0),
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type meal_type NOT NULL DEFAULT 'snack',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for daily log queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_food_log_user_date ON food_log(user_id, logged_date);

-- Index for meal type filtering
CREATE INDEX IF NOT EXISTS idx_food_log_meal_type ON food_log(user_id, logged_date, meal_type);
