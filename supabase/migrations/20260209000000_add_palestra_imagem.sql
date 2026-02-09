-- Add imagem_url column to palestras table
ALTER TABLE palestras ADD COLUMN IF NOT EXISTS imagem_url TEXT;

COMMENT ON COLUMN palestras.imagem_url IS 'URL da imagem de capa da palestra/atividade';
