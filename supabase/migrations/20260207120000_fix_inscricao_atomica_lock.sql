-- Corrige uso de FOR UPDATE com agregacao na funcao de inscricao atomica

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

  -- 5. Bloquear confirmados antes de contar (evita FOR UPDATE com agregacao)
  PERFORM 1
  FROM inscricoes_palestra
  WHERE palestra_id = p_palestra_id
    AND status_fila = 'CONFIRMADO'
  FOR UPDATE;

  SELECT COUNT(*)
  INTO v_count_confirmados
  FROM inscricoes_palestra
  WHERE palestra_id = p_palestra_id
    AND status_fila = 'CONFIRMADO';

  -- 6. Determinar status da inscricao
  IF v_count_confirmados < v_palestra.vagas THEN
    v_status_fila := 'CONFIRMADO';
  ELSE
    v_status_fila := 'LISTA_ESPERA';

    -- Bloquear lista de espera antes de calcular posicao
    PERFORM 1
    FROM inscricoes_palestra
    WHERE palestra_id = p_palestra_id
      AND status_fila = 'LISTA_ESPERA'
    FOR UPDATE;

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
