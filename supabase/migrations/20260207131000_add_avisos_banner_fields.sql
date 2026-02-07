-- Adiciona campos de banner nos avisos para carrossel

ALTER TABLE avisos
  ADD COLUMN IF NOT EXISTS imagem_url TEXT;

ALTER TABLE avisos
  ADD COLUMN IF NOT EXISTS link_url TEXT;

COMMENT ON COLUMN avisos.imagem_url IS 'URL da imagem para banner/carrossel';
COMMENT ON COLUMN avisos.link_url IS 'Link opcional do banner';
