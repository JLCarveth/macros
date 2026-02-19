CREATE TABLE IF NOT EXISTS weight_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(5, 2) NOT NULL CHECK (weight_kg > 0),
    body_fat_pct DECIMAL(4, 1) CHECK (body_fat_pct > 0 AND body_fat_pct < 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, logged_date)
);

CREATE INDEX IF NOT EXISTS idx_weight_log_user_date ON weight_log(user_id, logged_date);
