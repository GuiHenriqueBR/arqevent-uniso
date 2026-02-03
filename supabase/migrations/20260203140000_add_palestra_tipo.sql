-- Adiciona tipo (PALESTRA/ATIVIDADE) na tabela palestras
ALTER TABLE palestras
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'PALESTRA';

-- Garantir valores válidos (só adiciona se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'palestras_tipo_check'
    ) THEN
        ALTER TABLE palestras
        ADD CONSTRAINT palestras_tipo_check
        CHECK (tipo IN ('PALESTRA', 'ATIVIDADE'));
    END IF;
END $$;

COMMENT ON COLUMN palestras.tipo IS 'Tipo da atividade: PALESTRA ou ATIVIDADE';
