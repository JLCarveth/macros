-- Widen source CHECK on nutrition_records to include 'recipe'
ALTER TABLE nutrition_records DROP CONSTRAINT IF EXISTS nutrition_records_source_check;
ALTER TABLE nutrition_records ADD CONSTRAINT nutrition_records_source_check
    CHECK (source IN ('manual', 'scan', 'api', 'openfoodfacts', 'community', 'recipe'));

-- Widen serving_size_unit CHECK to include 'serving'
ALTER TABLE nutrition_records DROP CONSTRAINT IF EXISTS nutrition_records_serving_size_unit_check;
ALTER TABLE nutrition_records ADD CONSTRAINT nutrition_records_serving_size_unit_check
    CHECK (serving_size_unit IN ('g', 'ml', 'serving'));

-- Recipes: one row per recipe, points to a backing nutrition_record for per-serving totals
CREATE TABLE IF NOT EXISTS recipes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    servings            DECIMAL(10, 2) NOT NULL DEFAULT 1.0 CHECK (servings > 0),
    nutrition_record_id UUID NOT NULL REFERENCES nutrition_records(id),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ingredients: each row is one food used in the recipe
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id           UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    nutrition_record_id UUID NOT NULL REFERENCES nutrition_records(id) ON DELETE CASCADE,
    amount_servings     DECIMAL(10, 2) NOT NULL DEFAULT 1.0 CHECK (amount_servings > 0),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
