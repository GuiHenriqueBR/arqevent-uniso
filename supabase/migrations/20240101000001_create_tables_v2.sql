-- ArqEvent UNISO - Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable pgcrypto extension (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types (usando CHECK constraint em vez de ENUM para compatibilidade)
-- Turno: MANHA, NOITE
-- TipoUsuario: ALUNO, ORGANIZADOR, PALESTRANTE, ADMIN
-- StatusInscricao: PENDENTE, CONFIRMADA, CANCELADA
-- TurnoPermitido: TODOS, MANHA, NOITE
-- TipoCertificado: PARTICIPACAO, PALESTRANTE

-- Update profiles table to add required fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ra VARCHAR(20) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS semestre VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS turno VARCHAR(10) DEFAULT 'NOITE' CHECK (turno IN ('MANHA', 'NOITE'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'ALUNO' CHECK (tipo IN ('ALUNO', 'ORGANIZADOR', 'PALESTRANTE', 'ADMIN'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Eventos table
CREATE TABLE IF NOT EXISTS eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  local VARCHAR(255),
  banner_url TEXT,
  carga_horaria_total INTEGER DEFAULT 0,
  turno_permitido VARCHAR(10) DEFAULT 'TODOS' CHECK (turno_permitido IN ('TODOS', 'MANHA', 'NOITE')),
  vagas_totais INTEGER DEFAULT 100,
  ativo BOOLEAN DEFAULT true,
  organizador_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Palestras table
CREATE TABLE IF NOT EXISTS palestras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_hora_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  sala VARCHAR(100),
  vagas INTEGER DEFAULT 50,
  carga_horaria INTEGER DEFAULT 1,
  palestrante_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qr_code_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inscrições em eventos
CREATE TABLE IF NOT EXISTS inscricoes_evento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'CONFIRMADA' CHECK (status IN ('PENDENTE', 'CONFIRMADA', 'CANCELADA')),
  UNIQUE(usuario_id, evento_id)
);

-- Inscrições em palestras
CREATE TABLE IF NOT EXISTS inscricoes_palestra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  palestra_id UUID NOT NULL REFERENCES palestras(id) ON DELETE CASCADE,
  data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  presente BOOLEAN DEFAULT false,
  data_presenca TIMESTAMP WITH TIME ZONE,
  qr_validado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(usuario_id, palestra_id)
);

-- Certificados
CREATE TABLE IF NOT EXISTS certificados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  palestra_id UUID REFERENCES palestras(id) ON DELETE SET NULL,
  evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL,
  codigo_verificacao VARCHAR(50) UNIQUE NOT NULL,
  carga_horaria INTEGER NOT NULL,
  pdf_url TEXT,
  emitido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tipo VARCHAR(20) DEFAULT 'PARTICIPACAO' CHECK (tipo IN ('PARTICIPACAO', 'PALESTRANTE'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_ativo ON eventos(ativo);
CREATE INDEX IF NOT EXISTS idx_palestras_evento_id ON palestras(evento_id);
CREATE INDEX IF NOT EXISTS idx_palestras_data ON palestras(data_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_inscricoes_evento_usuario ON inscricoes_evento(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_evento_evento ON inscricoes_evento(evento_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_palestra_usuario ON inscricoes_palestra(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_palestra_palestra ON inscricoes_palestra(palestra_id);
CREATE INDEX IF NOT EXISTS idx_certificados_usuario ON certificados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_certificados_codigo ON certificados(codigo_verificacao);

-- RLS (Row Level Security) Policies

-- Enable RLS
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE palestras ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_palestra ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

-- Eventos: todos podem ver, organizadores e admins podem editar
CREATE POLICY "Eventos são visíveis publicamente" ON eventos
  FOR SELECT USING (true);

CREATE POLICY "Organizadores e admins podem criar eventos" ON eventos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Organizadores e admins podem atualizar eventos" ON eventos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Organizadores e admins podem deletar eventos" ON eventos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

-- Palestras: todos podem ver, organizadores e admins podem editar
CREATE POLICY "Palestras são visíveis publicamente" ON palestras
  FOR SELECT USING (true);

CREATE POLICY "Organizadores e admins podem criar palestras" ON palestras
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Organizadores e admins podem atualizar palestras" ON palestras
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Organizadores e admins podem deletar palestras" ON palestras
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

-- Inscrições evento: usuário pode ver e gerenciar suas próprias
CREATE POLICY "Usuários podem ver suas inscrições em eventos" ON inscricoes_evento
  FOR SELECT USING (
    auth.uid() = usuario_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Usuários podem se inscrever em eventos" ON inscricoes_evento
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem cancelar inscrição" ON inscricoes_evento
  FOR DELETE USING (
    auth.uid() = usuario_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

-- Inscrições palestra: usuário pode ver e gerenciar suas próprias
CREATE POLICY "Usuários podem ver suas inscrições em palestras" ON inscricoes_palestra
  FOR SELECT USING (
    auth.uid() = usuario_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Usuários podem se inscrever em palestras" ON inscricoes_palestra
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar presença" ON inscricoes_palestra
  FOR UPDATE USING (
    auth.uid() = usuario_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Usuários podem cancelar inscrição em palestras" ON inscricoes_palestra
  FOR DELETE USING (
    auth.uid() = usuario_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

-- Certificados: usuário pode ver os seus, admins podem ver todos
CREATE POLICY "Usuários podem ver seus certificados" ON certificados
  FOR SELECT USING (
    auth.uid() = usuario_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

CREATE POLICY "Admins podem criar certificados" ON certificados
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo IN ('ORGANIZADOR', 'ADMIN')
    )
  );

-- Seed data for testing
-- First, let's insert a test event
INSERT INTO eventos (titulo, descricao, data_inicio, data_fim, local, carga_horaria_total, turno_permitido, vagas_totais, ativo)
VALUES (
  'Semana de Arquitetura UNISO 2024',
  'A maior semana acadêmica do curso de Arquitetura e Urbanismo da UNISO. Palestras, workshops e exposições.',
  '2024-11-18 08:00:00-03',
  '2024-11-22 22:00:00-03',
  'Campus Cidade Universitária - Bloco H',
  20,
  'TODOS',
  200,
  true
) ON CONFLICT DO NOTHING;

-- Get the event id for palestras
DO $$
DECLARE
  evento_id UUID;
BEGIN
  SELECT id INTO evento_id FROM eventos WHERE titulo = 'Semana de Arquitetura UNISO 2024' LIMIT 1;
  
  IF evento_id IS NOT NULL THEN
    -- Insert palestras
    INSERT INTO palestras (evento_id, titulo, descricao, data_hora_inicio, data_hora_fim, sala, vagas, carga_horaria, qr_code_hash)
    VALUES 
      (evento_id, 'Arquitetura Sustentável no Brasil', 'Tendências e práticas de construção verde', '2024-11-18 09:00:00-03', '2024-11-18 11:00:00-03', 'Auditório Principal', 100, 2, md5(random()::text)),
      (evento_id, 'Design de Interiores Minimalista', 'A estética do menos é mais aplicada a espaços residenciais', '2024-11-18 14:00:00-03', '2024-11-18 16:00:00-03', 'Sala H101', 50, 2, md5(random()::text)),
      (evento_id, 'Urbanismo e Mobilidade Urbana', 'Como repensar as cidades para o futuro', '2024-11-19 09:00:00-03', '2024-11-19 12:00:00-03', 'Auditório Principal', 100, 3, md5(random()::text)),
      (evento_id, 'Workshop: Maquetes e Prototipagem', 'Técnicas avançadas de modelagem física', '2024-11-19 14:00:00-03', '2024-11-19 18:00:00-03', 'Laboratório de Maquetes', 30, 4, md5(random()::text)),
      (evento_id, 'BIM na Prática', 'Building Information Modeling para arquitetos', '2024-11-20 09:00:00-03', '2024-11-20 12:00:00-03', 'Lab. Informática', 40, 3, md5(random()::text)),
      (evento_id, 'Patrimônio Histórico e Restauração', 'Preservação e intervenção em edifícios históricos', '2024-11-20 14:00:00-03', '2024-11-20 17:00:00-03', 'Auditório Principal', 100, 3, md5(random()::text)),
      (evento_id, 'Paisagismo Urbano', 'Verde nas cidades: projetos e manutenção', '2024-11-21 09:00:00-03', '2024-11-21 11:00:00-03', 'Sala H102', 60, 2, md5(random()::text)),
      (evento_id, 'Iluminação Arquitetônica', 'Luz natural e artificial em projetos', '2024-11-21 14:00:00-03', '2024-11-21 16:00:00-03', 'Sala H101', 50, 2, md5(random()::text))
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Grant usage on schema public to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
