-- ===========================================
-- Atualizar tipos de aviso para o novo formato
-- ===========================================

-- Remover a constraint antiga
ALTER TABLE avisos DROP CONSTRAINT IF EXISTS avisos_tipo_check;

-- Atualizar os valores existentes para o novo formato
UPDATE avisos SET tipo = 'info' WHERE tipo = 'INFO';
UPDATE avisos SET tipo = 'warning' WHERE tipo = 'ALERTA';
UPDATE avisos SET tipo = 'error' WHERE tipo = 'URGENTE';

-- Adicionar nova constraint com os tipos corretos
ALTER TABLE avisos ADD CONSTRAINT avisos_tipo_check 
  CHECK (tipo IN ('info', 'success', 'warning', 'error'));

-- Atualizar valor padrão
ALTER TABLE avisos ALTER COLUMN tipo SET DEFAULT 'info';

-- Atualizar política de SELECT para admins verem todos os avisos (não só ativos)
DROP POLICY IF EXISTS "Avisos são visíveis para todos autenticados" ON avisos;
CREATE POLICY "Alunos veem apenas avisos ativos" ON avisos
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      ativo = true OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo IN ('ADMIN', 'ORGANIZADOR')
      )
    )
  );
