-- Migracao: Inscricao Atomica para Palestras
-- Suporta 400+ inscricoes simultaneas sem race conditions

-- Adicionar colunas de lista de espera se nao existirem
ALTER TABLE inscricoes_palestra
  ADD COLUMN IF NOT EXISTS status_fila VARCHAR(20) DEFAULT 'CONFIRMADO'
    CHECK (status_fila IN ('CONFIRMADO', 'LISTA_ESPERA', 'CANCELADO'));

ALTER TABLE inscricoes_palestra
  ADD COLUMN IF NOT EXISTS posicao_fila INTEGER;

ALTER TABLE inscricoes_palestra
  ADD COLUMN IF NOT EXISTS status_presenca VARCHAR(20) DEFAULT 'INSCRITO'
    CHECK (status_presenca IN ('INSCRITO', 'PRESENTE', 'AUSENTE', 'WALK_IN', 'ATRASADO', 'JUSTIFICADO'));

ALTER TABLE inscricoes_palestra
  ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false;

-- Adicionar coluna de palestrante_nome se nao existir
ALTER TABLE palestras
  ADD COLUMN IF NOT EXISTS palestrante_nome VARCHAR(255);

ALTER TABLE palestras
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'PALESTRA'
    CHECK (tipo IN ('PALESTRA', 'ATIVIDADE'));

-- Indices adicionais para performance com muitas inscricoes
CREATE INDEX IF NOT EXISTS idx_inscricoes_palestra_status_fila
  ON inscricoes_palestra(palestra_id, status_fila);

CREATE INDEX IF NOT EXISTS idx_inscricoes_palestra_posicao_fila
  ON inscricoes_palestra(palestra_id, posicao_fila)
  WHERE posicao_fila IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_palestras_evento_data
  ON palestras(evento_id, data_hora_inicio, data_hora_fim);

-- Funcao RPC atomica para inscricao em palestra
-- Usa SELECT FOR UPDATE para evitar race conditions
CREATE OR REPLACE FUNCTION inscrever_palestra_atomico(
  p_usuario_id UUID,
  p_palestra_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_palestra RECORD;
  v_inscricao_existente RECORD;
  v_inscricao_evento RECORD;
  v_count_confirmados INTEGER;
  v_status_fila VARCHAR(20);
  v_posicao_fila INTEGER := NULL;
  v_nova_inscricao RECORD;
  v_conflito_palestra RECORD;
BEGIN
  -- 1. Bloquear a palestra para evitar race condition
  SELECT id, evento_id, vagas, titulo, data_hora_inicio, data_hora_fim, sala
  INTO v_palestra
  FROM palestras
  WHERE id = p_palestra_id
  FOR UPDATE;

  IF v_palestra IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Palestra nao encontrada'
    );
  END IF;

  -- 2. Verificar inscricao no evento
  SELECT id INTO v_inscricao_evento
  FROM inscricoes_evento
  WHERE usuario_id = p_usuario_id
    AND evento_id = v_palestra.evento_id
    AND status = 'CONFIRMADA';

  IF v_inscricao_evento IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voce precisa estar inscrito no evento para se inscrever nesta palestra'
    );
  END IF;

  -- 3. Verificar inscricao existente
  SELECT id, status_fila INTO v_inscricao_existente
  FROM inscricoes_palestra
  WHERE usuario_id = p_usuario_id
    AND palestra_id = p_palestra_id;

  IF v_inscricao_existente IS NOT NULL THEN
    IF v_inscricao_existente.status_fila = 'CANCELADO' THEN
      -- Reativar inscricao cancelada
      UPDATE inscricoes_palestra
      SET status_fila = 'CONFIRMADO',
          status_presenca = 'INSCRITO',
          data_inscricao = CURRENT_TIMESTAMP
      WHERE id = v_inscricao_existente.id;

      RETURN jsonb_build_object(
        'success', true,
        'inscricao_id', v_inscricao_existente.id,
        'status_fila', 'CONFIRMADO',
        'message', 'Inscricao reativada com sucesso'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Voce ja esta inscrito nesta palestra'
      );
    END IF;
  END IF;

  -- 4. Verificar conflito de horarios
  SELECT p.id, p.titulo, p.data_hora_inicio, p.data_hora_fim
  INTO v_conflito_palestra
  FROM inscricoes_palestra ip
  JOIN palestras p ON p.id = ip.palestra_id
  WHERE ip.usuario_id = p_usuario_id
    AND ip.status_fila IN ('CONFIRMADO', 'LISTA_ESPERA')
    AND v_palestra.data_hora_inicio < p.data_hora_fim
    AND v_palestra.data_hora_fim > p.data_hora_inicio
  LIMIT 1;

  IF v_conflito_palestra IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Conflito de horario! Voce ja esta inscrito em "%s" que ocorre das %s as %s',
        v_conflito_palestra.titulo,
        TO_CHAR(v_conflito_palestra.data_hora_inicio AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
        TO_CHAR(v_conflito_palestra.data_hora_fim AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')
      )
    );
  END IF;

  -- 5. Contar inscricoes confirmadas (com lock)
  SELECT COUNT(*)
  INTO v_count_confirmados
  FROM inscricoes_palestra
  WHERE palestra_id = p_palestra_id
    AND status_fila = 'CONFIRMADO'
  FOR UPDATE;

  -- 6. Determinar status da inscricao
  IF v_count_confirmados < v_palestra.vagas THEN
    v_status_fila := 'CONFIRMADO';
  ELSE
    v_status_fila := 'LISTA_ESPERA';

    -- Calcular posicao na fila
    SELECT COALESCE(MAX(posicao_fila), 0) + 1
    INTO v_posicao_fila
    FROM inscricoes_palestra
    WHERE palestra_id = p_palestra_id
      AND status_fila = 'LISTA_ESPERA';
  END IF;

  -- 7. Inserir inscricao
  INSERT INTO inscricoes_palestra (
    usuario_id,
    palestra_id,
    presente,
    status_presenca,
    is_walk_in,
    status_fila,
    posicao_fila
  )
  VALUES (
    p_usuario_id,
    p_palestra_id,
    false,
    'INSCRITO',
    false,
    v_status_fila,
    v_posicao_fila
  )
  RETURNING * INTO v_nova_inscricao;

  -- 8. Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'inscricao_id', v_nova_inscricao.id,
    'status_fila', v_status_fila,
    'posicao_fila', v_posicao_fila,
    'palestra', jsonb_build_object(
      'id', v_palestra.id,
      'titulo', v_palestra.titulo,
      'data_hora_inicio', v_palestra.data_hora_inicio,
      'data_hora_fim', v_palestra.data_hora_fim,
      'sala', v_palestra.sala
    ),
    'message', CASE
      WHEN v_status_fila = 'LISTA_ESPERA'
      THEN format('Voce esta na posicao %s da lista de espera', v_posicao_fila)
      ELSE 'Inscricao confirmada com sucesso'
    END
  );
END;
$$;

-- Funcao para promover proximo da lista de espera
CREATE OR REPLACE FUNCTION promover_lista_espera()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_palestra RECORD;
  v_vagas INTEGER;
  v_confirmados INTEGER;
  v_proximo RECORD;
BEGIN
  -- Apenas quando uma inscricao e cancelada ou deletada
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status_fila = 'CANCELADO' AND OLD.status_fila = 'CONFIRMADO') THEN
    -- Usar OLD para DELETE e UPDATE
    SELECT id, vagas INTO v_palestra
    FROM palestras
    WHERE id = COALESCE(OLD.palestra_id, NEW.palestra_id)
    FOR UPDATE;

    -- Contar confirmados atuais
    SELECT COUNT(*)
    INTO v_confirmados
    FROM inscricoes_palestra
    WHERE palestra_id = v_palestra.id
      AND status_fila = 'CONFIRMADO';

    -- Se ha vagas, promover o proximo da lista
    IF v_confirmados < v_palestra.vagas THEN
      SELECT id, usuario_id
      INTO v_proximo
      FROM inscricoes_palestra
      WHERE palestra_id = v_palestra.id
        AND status_fila = 'LISTA_ESPERA'
      ORDER BY posicao_fila ASC
      LIMIT 1
      FOR UPDATE;

      IF v_proximo IS NOT NULL THEN
        UPDATE inscricoes_palestra
        SET status_fila = 'CONFIRMADO',
            posicao_fila = NULL
        WHERE id = v_proximo.id;

        -- Reordenar posicoes na fila
        UPDATE inscricoes_palestra ip
        SET posicao_fila = subq.nova_posicao
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY posicao_fila) as nova_posicao
          FROM inscricoes_palestra
          WHERE palestra_id = v_palestra.id
            AND status_fila = 'LISTA_ESPERA'
        ) subq
        WHERE ip.id = subq.id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger para promover lista de espera
DROP TRIGGER IF EXISTS trigger_promover_lista_espera ON inscricoes_palestra;

CREATE TRIGGER trigger_promover_lista_espera
  AFTER UPDATE OR DELETE ON inscricoes_palestra
  FOR EACH ROW
  EXECUTE FUNCTION promover_lista_espera();

-- Conceder permissao para chamar a funcao RPC
GRANT EXECUTE ON FUNCTION inscrever_palestra_atomico(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION promover_lista_espera() TO authenticated;

-- Comentarios
COMMENT ON FUNCTION inscrever_palestra_atomico IS 'Inscricao atomica em palestra com suporte a lista de espera. Evita race conditions usando SELECT FOR UPDATE.';
COMMENT ON FUNCTION promover_lista_espera IS 'Trigger que promove automaticamente o proximo da lista de espera quando uma vaga e liberada.';
