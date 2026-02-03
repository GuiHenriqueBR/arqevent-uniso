-- Adiciona nome livre do palestrante na tabela de palestras
ALTER TABLE palestras
ADD COLUMN IF NOT EXISTS palestrante_nome TEXT;

COMMENT ON COLUMN palestras.palestrante_nome IS 'Nome do palestrante informado manualmente quando não houver usuário vinculado';
