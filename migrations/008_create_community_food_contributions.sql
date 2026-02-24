-- Migration: 008_create_community_food_contributions
-- Description: Create contributions table to store individual user submissions
--              for community foods, enabling median-based aggregation instead of
--              silently discarding data after the first contribution.

CREATE TABLE IF NOT EXISTS community_food_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_food_id UUID NOT NULL REFERENCES community_foods(id) ON DELETE CASCADE,
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
    off_product_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- One contribution per user per community food
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_food_contributions_food_user
    ON community_food_contributions(community_food_id, user_id);

-- Fast aggregation lookups by community food
CREATE INDEX IF NOT EXISTS idx_community_food_contributions_food_id
    ON community_food_contributions(community_food_id);

-- Backfill: preserve original contributor data as the first contribution row
INSERT INTO community_food_contributions (
    community_food_id, user_id, name,
    serving_size_value, serving_size_unit, calories,
    total_fat, carbohydrates, fiber, sugars, protein, cholesterol, sodium,
    off_product_url, created_at
)
SELECT
    cf.id, cf.contributed_by_user_id, cf.name,
    cf.serving_size_value, cf.serving_size_unit, cf.calories,
    cf.total_fat, cf.carbohydrates, cf.fiber, cf.sugars, cf.protein, cf.cholesterol, cf.sodium,
    cf.off_product_url, cf.created_at
FROM community_foods cf
WHERE cf.contributed_by_user_id IS NOT NULL
ON CONFLICT DO NOTHING;
