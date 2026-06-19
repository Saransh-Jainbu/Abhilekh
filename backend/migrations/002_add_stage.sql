-- Track granular processing stage for live progress UI
ALTER TABLE documents ADD COLUMN IF NOT EXISTS stage VARCHAR(30);
-- Track preferred language for insights & chat
ALTER TABLE documents ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en';
