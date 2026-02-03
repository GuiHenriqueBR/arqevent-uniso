-- Adiciona tipo (PALESTRA/ATIVIDADE) na tabela palestras
ALTER TABLE palestras
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'PALESTRA';

-- Garantir valores válidos
ALTER TABLE palestras
ADD CONSTRAINT IF NOT EXISTS palestras_tipo_check
CHECK (tipo IN ('PALESTRA', 'ATIVIDADE'));

COMMENT ON COLUMN palestras.tipo IS 'Tipo da atividade: PALESTRA ou ATIVIDADE';
