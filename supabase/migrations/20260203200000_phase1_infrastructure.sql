-- ===========================================
-- FASE 1: INFRAESTRUTURA BASE
-- Tabelas de avisos, configurações e função de reset
-- ===========================================

-- =====================
-- 1. TABELA DE AVISOS
-- =====================
CREATE TABLE IF NOT EXISTS avisos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'INFO' CHECK (tipo IN ('INFO', 'ALERTA', 'URGENTE')),
  criado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para avisos
CREATE INDEX IF NOT EXISTS idx_avisos_ativo ON avisos(ativo);
CREATE INDEX IF NOT EXISTS idx_avisos_created ON avisos(created_at DESC);

-- RLS para avisos
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Avisos são visíveis para todos autenticados" ON avisos;
CREATE POLICY "Avisos são visíveis para todos autenticados" ON avisos
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

DROP POLICY IF EXISTS "Admins podem criar avisos" ON avisos;
CREATE POLICY "Admins podem criar avisos" ON avisos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ADMIN', 'ORGANIZADOR')
    )
  );

DROP POLICY IF EXISTS "Admins podem atualizar avisos" ON avisos;
CREATE POLICY "Admins podem atualizar avisos" ON avisos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ADMIN', 'ORGANIZADOR')
    )
  );

DROP POLICY IF EXISTS "Admins podem deletar avisos" ON avisos;
CREATE POLICY "Admins podem deletar avisos" ON avisos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ADMIN', 'ORGANIZADOR')
    )
  );

-- =====================
-- 2. TABELA DE CONFIGURAÇÕES
-- =====================
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descricao VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- RLS para configurações
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Configs são visíveis para autenticados" ON configuracoes;
CREATE POLICY "Configs são visíveis para autenticados" ON configuracoes
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins podem gerenciar configs" ON configuracoes;
CREATE POLICY "Admins podem gerenciar configs" ON configuracoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo = 'ADMIN'
    )
  );

-- Configurações padrão
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('nome_instituicao', 'UNISO', 'Nome da instituição'),
  ('nome_sistema', 'ArqEvent', 'Nome do sistema'),
  ('email_contato', 'eventos@uniso.br', 'Email de contato'),
  ('permite_inscricao_publica', 'true', 'Permite inscrição sem login'),
  ('tema_cor_primaria', '#7C3AED', 'Cor primária do tema')
ON CONFLICT (chave) DO NOTHING;

-- =====================
-- 3. FUNÇÃO DE RESET DO SISTEMA
-- =====================
CREATE OR REPLACE FUNCTION reset_sistema(manter_admin BOOLEAN DEFAULT true)
RETURNS TEXT AS $$
DECLARE
  admin_email TEXT := 'gui.leitedepaula@hotmail.com';
  deleted_counts TEXT;
  cert_count INTEGER;
  insc_pal_count INTEGER;
  insc_ev_count INTEGER;
  pal_count INTEGER;
  ev_count INTEGER;
  aviso_count INTEGER;
BEGIN
  -- Contar registros antes de deletar
  SELECT COUNT(*) INTO cert_count FROM certificados;
  SELECT COUNT(*) INTO insc_pal_count FROM inscricoes_palestra;
  SELECT COUNT(*) INTO insc_ev_count FROM inscricoes_evento;
  SELECT COUNT(*) INTO pal_count FROM palestras;
  SELECT COUNT(*) INTO ev_count FROM eventos;
  SELECT COUNT(*) INTO aviso_count FROM avisos;

  -- Deletar na ordem correta (respeitar foreign keys)
  DELETE FROM certificados;
  DELETE FROM inscricoes_palestra;
  DELETE FROM inscricoes_evento;
  DELETE FROM palestras;
  DELETE FROM eventos;
  DELETE FROM avisos;

  deleted_counts := 'Reset completo! Deletados: ' || 
    cert_count || ' certificados, ' ||
    insc_pal_count || ' inscrições palestras, ' ||
    insc_ev_count || ' inscrições eventos, ' ||
    pal_count || ' palestras, ' ||
    ev_count || ' eventos, ' ||
    aviso_count || ' avisos.';

  RETURN deleted_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- 4. FUNÇÃO PARA CRIAR DADOS DE EXEMPLO
-- (Cria evento e palestras usando o admin atual)
-- =====================
CREATE OR REPLACE FUNCTION criar_dados_exemplo()
RETURNS TEXT AS $$
DECLARE
  evento_id UUID;
  admin_id UUID;
BEGIN
  -- Buscar admin
  SELECT id INTO admin_id FROM profiles WHERE tipo = 'ADMIN' LIMIT 1;
  
  IF admin_id IS NULL THEN
    RETURN 'Admin não encontrado. Faça login como admin primeiro.';
  END IF;

  -- Verificar se já existe um evento
  SELECT id INTO evento_id FROM eventos WHERE titulo LIKE 'Semana de Arquitetura%' LIMIT 1;
  
  IF evento_id IS NOT NULL THEN
    RETURN 'Dados de exemplo já existem. Use Reset para limpar antes de criar novos.';
  END IF;

  -- Criar evento de exemplo
  INSERT INTO eventos (
    titulo, 
    descricao, 
    data_inicio, 
    data_fim, 
    local, 
    carga_horaria_total, 
    turno_permitido, 
    vagas_totais, 
    ativo, 
    organizador_id
  ) VALUES (
    'Semana de Arquitetura e Urbanismo 2026',
    'A tradicional Semana de Arquitetura e Urbanismo da UNISO traz palestras, workshops e exposições sobre os temas mais relevantes da área.',
    '2026-03-15 08:00:00-03',
    '2026-03-20 22:00:00-03',
    'Campus UNISO - Bloco A',
    20,
    'TODOS',
    200,
    true,
    admin_id
  ) RETURNING id INTO evento_id;

  -- Criar palestras do evento
  INSERT INTO palestras (
    evento_id, titulo, descricao, data_hora_inicio, data_hora_fim, sala, vagas, carga_horaria, palestrante_id
  ) VALUES 
    (evento_id, 'Arquitetura Sustentável: Desafios e Soluções', 
     'Palestra sobre os principais desafios da arquitetura sustentável e soluções inovadoras.',
     '2026-03-15 09:00:00-03', '2026-03-15 11:00:00-03', 'Auditório Principal', 100, 2, admin_id),
    (evento_id, 'Urbanismo e Mobilidade nas Cidades do Futuro',
     'Discussão sobre como as cidades podem se adaptar para uma mobilidade mais sustentável.',
     '2026-03-16 14:00:00-03', '2026-03-16 17:00:00-03', 'Sala A101', 50, 3, admin_id),
    (evento_id, 'Workshop: BIM na Prática',
     'Workshop hands-on sobre Building Information Modeling.',
     '2026-03-17 08:00:00-03', '2026-03-17 12:00:00-03', 'Laboratório de Informática', 30, 4, admin_id);

  -- Criar aviso de boas-vindas
  INSERT INTO avisos (titulo, mensagem, tipo, criado_por)
  VALUES (
    'Bem-vindo ao ArqEvent!',
    'Sistema de gestão de eventos da Semana de Arquitetura e Urbanismo da UNISO. Fique atento aos avisos e novidades!',
    'INFO',
    admin_id
  );

  RETURN 'Criado evento "Semana de Arquitetura 2026" com 3 palestras e 1 aviso de boas-vindas.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para autenticados executarem as funções
GRANT EXECUTE ON FUNCTION reset_sistema TO authenticated;
GRANT EXECUTE ON FUNCTION criar_dados_exemplo TO authenticated;
