-- Adicionar configuração de ano letivo
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('ano_letivo', '2026', 'Ano letivo atual')
ON CONFLICT (chave) DO NOTHING;
