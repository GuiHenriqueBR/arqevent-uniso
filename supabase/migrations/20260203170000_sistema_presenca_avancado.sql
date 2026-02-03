-- ===========================================
-- FASE A: SISTEMA DE PRESENÇA AVANÇADO
-- Status de presença, notificações, templates, logos
-- ===========================================

-- =====================
-- 1. ATUALIZAR TABELA INSCRICOES_PALESTRA
-- =====================

-- Adicionar campo status_presenca com 4 estados possíveis
ALTER TABLE inscricoes_palestra 
ADD COLUMN IF NOT EXISTS status_presenca VARCHAR(30) DEFAULT 'INSCRITO' 
CHECK (status_presenca IN ('INSCRITO', 'PRESENTE', 'AUSENTE', 'WALK_IN'));

-- Adicionar campo para identificar walk-ins (quem não estava inscrito)
ALTER TABLE inscricoes_palestra 
ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false;

-- Migrar dados existentes: quem tem presente=true vira PRESENTE
UPDATE inscricoes_palestra 
SET status_presenca = 'PRESENTE' 
WHERE presente = true AND status_presenca = 'INSCRITO';

-- =====================
-- 2. ATUALIZAR TABELA PALESTRAS
-- =====================

-- Adicionar campo para configurar tempo para marcar ausentes (em minutos)
ALTER TABLE palestras 
ADD COLUMN IF NOT EXISTS tempo_marcar_ausente INTEGER DEFAULT 60;

-- =====================
-- 3. TABELA DE NOTIFICAÇÕES
-- =====================
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'presenca_confirmada', 'inscricao_confirmada', 'ausente_notificacao'
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  dados JSONB DEFAULT '{}', -- dados extras (palestra_id, evento_id, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(usuario_id, lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created ON notificacoes(created_at DESC);

-- RLS para notificações
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem suas próprias notificações" ON notificacoes;
CREATE POLICY "Usuários veem suas próprias notificações" ON notificacoes
  FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Sistema pode criar notificações" ON notificacoes;
CREATE POLICY "Sistema pode criar notificações" ON notificacoes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários podem atualizar suas notificações" ON notificacoes;
CREATE POLICY "Usuários podem atualizar suas notificações" ON notificacoes
  FOR UPDATE USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas notificações" ON notificacoes;
CREATE POLICY "Usuários podem deletar suas notificações" ON notificacoes
  FOR DELETE USING (auth.uid() = usuario_id);

-- =====================
-- 4. TABELA DE TEMPLATES DE NOTIFICAÇÃO
-- =====================
CREATE TABLE IF NOT EXISTS templates_notificacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) UNIQUE NOT NULL, -- 'presenca_confirmada', 'inscricao_confirmada', 'ausente_notificacao'
  titulo_template VARCHAR(255) NOT NULL,
  mensagem_template TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES profiles(id)
);

-- Inserir templates padrão
INSERT INTO templates_notificacao (tipo, titulo_template, mensagem_template) VALUES
  ('presenca_confirmada', 'Presença Confirmada! ✅', 'Sua presença foi confirmada em "{{palestra_titulo}}"! Você pode baixar seu comprovante de participação.'),
  ('inscricao_confirmada', 'Inscrição Realizada! 📝', 'Você está inscrito em "{{palestra_titulo}}" - {{data}} às {{hora}} em {{local}}. Não esqueça de comparecer e confirmar sua presença!'),
  ('ausente_notificacao', 'Você não compareceu ⚠️', 'Você se inscreveu em "{{palestra_titulo}}" mas não confirmou presença. Se houve algum imprevisto, entre em contato com a organização.')
ON CONFLICT (tipo) DO NOTHING;

-- RLS para templates
ALTER TABLE templates_notificacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver templates ativos" ON templates_notificacao;
CREATE POLICY "Todos podem ver templates ativos" ON templates_notificacao
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins podem gerenciar templates" ON templates_notificacao;
CREATE POLICY "Admins podem gerenciar templates" ON templates_notificacao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ADMIN', 'ORGANIZADOR')
    )
  );

-- =====================
-- 5. TABELA DE CONFIGURAÇÕES DO SISTEMA (Logos)
-- =====================
-- Adicionar campos para logos na tabela configuracoes existente
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('logo_principal', NULL, 'URL da logo principal da UNISO'),
  ('logo_secundaria', NULL, 'URL da logo secundária (ex: curso de Arquitetura)'),
  ('nome_instituicao', 'Universidade de Sorocaba - UNISO', 'Nome da instituição para comprovantes'),
  ('nome_evento_padrao', 'Semana de Arquitetura e Urbanismo', 'Nome padrão do evento')
ON CONFLICT (chave) DO NOTHING;

-- =====================
-- 6. FUNÇÃO PARA MARCAR AUSENTES AUTOMATICAMENTE
-- =====================
CREATE OR REPLACE FUNCTION marcar_ausentes_palestra(p_palestra_id UUID)
RETURNS TABLE(total_marcados INTEGER, mensagem TEXT) AS $$
DECLARE
  v_palestra RECORD;
  v_count INTEGER;
BEGIN
  -- Buscar palestra
  SELECT * INTO v_palestra FROM palestras WHERE id = p_palestra_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 'Palestra não encontrada'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar se já passou o tempo configurado após o término
  IF NOW() < (v_palestra.data_hora_fim + (v_palestra.tempo_marcar_ausente || ' minutes')::INTERVAL) THEN
    RETURN QUERY SELECT 0, 'Ainda não passou o tempo configurado para marcar ausentes'::TEXT;
    RETURN;
  END IF;
  
  -- Marcar como ausentes quem ainda está com status INSCRITO
  UPDATE inscricoes_palestra
  SET status_presenca = 'AUSENTE'
  WHERE palestra_id = p_palestra_id
    AND status_presenca = 'INSCRITO';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count, format('Marcados %s alunos como ausentes', v_count)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- 7. FUNÇÃO PARA PROCESSAR TODAS AS PALESTRAS PENDENTES
-- =====================
CREATE OR REPLACE FUNCTION processar_ausentes_todas_palestras()
RETURNS TABLE(palestra_id UUID, palestra_titulo TEXT, marcados INTEGER) AS $$
DECLARE
  v_palestra RECORD;
  v_result RECORD;
BEGIN
  -- Buscar palestras que já terminaram + tempo configurado e têm inscritos pendentes
  FOR v_palestra IN 
    SELECT DISTINCT p.id, p.titulo
    FROM palestras p
    INNER JOIN inscricoes_palestra ip ON ip.palestra_id = p.id
    WHERE ip.status_presenca = 'INSCRITO'
      AND NOW() >= (p.data_hora_fim + (p.tempo_marcar_ausente || ' minutes')::INTERVAL)
  LOOP
    SELECT * INTO v_result FROM marcar_ausentes_palestra(v_palestra.id);
    RETURN QUERY SELECT v_palestra.id, v_palestra.titulo, v_result.total_marcados;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- 8. FUNÇÃO PARA ENVIAR NOTIFICAÇÃO
-- =====================
CREATE OR REPLACE FUNCTION enviar_notificacao(
  p_usuario_id UUID,
  p_tipo VARCHAR(50),
  p_dados JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_template RECORD;
  v_titulo TEXT;
  v_mensagem TEXT;
  v_notificacao_id UUID;
BEGIN
  -- Buscar template
  SELECT * INTO v_template FROM templates_notificacao WHERE tipo = p_tipo AND ativo = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template de notificação não encontrado: %', p_tipo;
  END IF;
  
  -- Substituir variáveis no template
  v_titulo := v_template.titulo_template;
  v_mensagem := v_template.mensagem_template;
  
  -- Substituir placeholders
  v_titulo := REPLACE(v_titulo, '{{palestra_titulo}}', COALESCE(p_dados->>'palestra_titulo', ''));
  v_titulo := REPLACE(v_titulo, '{{data}}', COALESCE(p_dados->>'data', ''));
  v_titulo := REPLACE(v_titulo, '{{hora}}', COALESCE(p_dados->>'hora', ''));
  v_titulo := REPLACE(v_titulo, '{{local}}', COALESCE(p_dados->>'local', ''));
  v_titulo := REPLACE(v_titulo, '{{aluno_nome}}', COALESCE(p_dados->>'aluno_nome', ''));
  
  v_mensagem := REPLACE(v_mensagem, '{{palestra_titulo}}', COALESCE(p_dados->>'palestra_titulo', ''));
  v_mensagem := REPLACE(v_mensagem, '{{data}}', COALESCE(p_dados->>'data', ''));
  v_mensagem := REPLACE(v_mensagem, '{{hora}}', COALESCE(p_dados->>'hora', ''));
  v_mensagem := REPLACE(v_mensagem, '{{local}}', COALESCE(p_dados->>'local', ''));
  v_mensagem := REPLACE(v_mensagem, '{{aluno_nome}}', COALESCE(p_dados->>'aluno_nome', ''));
  
  -- Inserir notificação
  INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, dados)
  VALUES (p_usuario_id, p_tipo, v_titulo, v_mensagem, p_dados)
  RETURNING id INTO v_notificacao_id;
  
  RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- 9. TRIGGER PARA NOTIFICAR QUANDO MARCAR AUSENTE
-- =====================
CREATE OR REPLACE FUNCTION trigger_notificar_ausente()
RETURNS TRIGGER AS $$
DECLARE
  v_palestra RECORD;
BEGIN
  -- Só dispara quando muda de INSCRITO para AUSENTE
  IF OLD.status_presenca = 'INSCRITO' AND NEW.status_presenca = 'AUSENTE' THEN
    -- Buscar dados da palestra
    SELECT * INTO v_palestra FROM palestras WHERE id = NEW.palestra_id;
    
    -- Enviar notificação
    PERFORM enviar_notificacao(
      NEW.usuario_id,
      'ausente_notificacao',
      jsonb_build_object(
        'palestra_id', NEW.palestra_id,
        'palestra_titulo', v_palestra.titulo,
        'data', TO_CHAR(v_palestra.data_hora_inicio, 'DD/MM/YYYY'),
        'hora', TO_CHAR(v_palestra.data_hora_inicio, 'HH24:MI'),
        'local', v_palestra.sala
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_inscricao_ausente ON inscricoes_palestra;
CREATE TRIGGER trigger_inscricao_ausente
  AFTER UPDATE ON inscricoes_palestra
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notificar_ausente();

-- =====================
-- 10. GRANT PERMISSIONS
-- =====================
GRANT EXECUTE ON FUNCTION marcar_ausentes_palestra(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION processar_ausentes_todas_palestras() TO authenticated;
GRANT EXECUTE ON FUNCTION enviar_notificacao(UUID, VARCHAR, JSONB) TO authenticated;
