-- Migration: Adicionar status ATRASADO e JUSTIFICADO nas presenças
-- Data: 2026-02-03

-- Remover constraint antiga
ALTER TABLE inscricoes_palestra 
DROP CONSTRAINT IF EXISTS inscricoes_palestra_status_presenca_check;

-- Adicionar nova constraint com todos os status
ALTER TABLE inscricoes_palestra 
ADD CONSTRAINT inscricoes_palestra_status_presenca_check 
CHECK (status_presenca IN ('INSCRITO', 'PRESENTE', 'AUSENTE', 'WALK_IN', 'ATRASADO', 'JUSTIFICADO'));

-- Adicionar coluna para justificativa (opcional)
ALTER TABLE inscricoes_palestra 
ADD COLUMN IF NOT EXISTS justificativa TEXT;

-- Comentário
COMMENT ON COLUMN inscricoes_palestra.status_presenca IS 'Status: INSCRITO (pendente), PRESENTE (confirmado), AUSENTE, WALK_IN (não inscrito), ATRASADO (chegou atrasado), JUSTIFICADO (falta justificada)';
COMMENT ON COLUMN inscricoes_palestra.justificativa IS 'Texto da justificativa para faltas justificadas';
