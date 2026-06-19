-- Store per-page OCR text + per-page translations so the viewer can show
-- the PDF page on the left and its translation on the right, page by page.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_pages JSONB;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS translated_pages JSONB;
