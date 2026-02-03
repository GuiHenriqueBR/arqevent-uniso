-- Disable RLS for development
ALTER TABLE eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE palestras DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_evento DISABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_palestra DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificados DISABLE ROW LEVEL SECURITY;

-- Insert test event
INSERT INTO eventos (titulo, descricao, data_inicio, data_fim, local, carga_horaria_total, turno_permitido, vagas_totais, ativo)
VALUES (
  'Semana de Arquitetura UNISO 2026',
  'A maior semana acadêmica do curso de Arquitetura e Urbanismo da UNISO. Palestras, workshops e exposições.',
  '2026-03-18 08:00:00-03',
  '2026-03-22 22:00:00-03',
  'Campus Cidade Universitária - Bloco H',
  20,
  'TODOS',
  200,
  true
) ON CONFLICT DO NOTHING;

-- Insert test lectures
DO $$
DECLARE
  ev_id UUID;
BEGIN
  SELECT id INTO ev_id FROM eventos WHERE titulo LIKE '%Semana de Arquitetura%' LIMIT 1;
  
  IF ev_id IS NOT NULL THEN
    INSERT INTO palestras (evento_id, titulo, descricao, data_hora_inicio, data_hora_fim, sala, vagas, carga_horaria, qr_code_hash)
    VALUES 
      (ev_id, 'Arquitetura Sustentável no Brasil', 'Tendências e práticas de construção verde', '2026-03-18 09:00:00-03', '2026-03-18 11:00:00-03', 'Auditório Principal', 100, 2, md5(random()::text)),
      (ev_id, 'Design de Interiores Minimalista', 'A estética do menos é mais aplicada a espaços residenciais', '2026-03-18 14:00:00-03', '2026-03-18 16:00:00-03', 'Sala H101', 50, 2, md5(random()::text)),
      (ev_id, 'Urbanismo e Mobilidade Urbana', 'Como repensar as cidades para o futuro', '2026-03-19 09:00:00-03', '2026-03-19 12:00:00-03', 'Auditório Principal', 100, 3, md5(random()::text)),
      (ev_id, 'Workshop: Maquetes e Prototipagem', 'Técnicas avançadas de modelagem física', '2026-03-19 14:00:00-03', '2026-03-19 18:00:00-03', 'Laboratório de Maquetes', 30, 4, md5(random()::text)),
      (ev_id, 'BIM na Prática', 'Building Information Modeling para arquitetos', '2026-03-20 09:00:00-03', '2026-03-20 12:00:00-03', 'Lab. Informática', 40, 3, md5(random()::text))
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
