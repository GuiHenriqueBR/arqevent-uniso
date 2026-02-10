-- Remove a exigência de inscrição no evento para se inscrever em palestras/atividades
-- Usuários agora podem se inscrever diretamente em qualquer palestra/atividade
-- Também remove verificação de conflito de horário (já removida no banco anteriormente)

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
  v_count_confirmados INTEGER;
  v_status_fila VARCHAR(20);
  v_posicao_fila INTEGER := NULL;
  v_nova_inscricao RECORD;
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

  -- 2. Verificar inscricao existente
  SELECT id, status_fila INTO v_inscricao_existente
  FROM inscricoes_palestra
  WHERE usuario_id = p_usuario_id
    AND palestra_id = p_palestra_id;

  IF v_inscricao_existente IS NOT NULL THEN
    IF v_inscricao_existente.status_fila = 'CANCELADO' THEN
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

  -- 3. Bloquear confirmados antes de contar
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

  IF v_count_confirmados < v_palestra.vagas THEN
    v_status_fila := 'CONFIRMADO';
  ELSE
    v_status_fila := 'LISTA_ESPERA';
    SELECT COUNT(*) + 1
    INTO v_posicao_fila
    FROM inscricoes_palestra
    WHERE palestra_id = p_palestra_id
      AND status_fila = 'LISTA_ESPERA';
  END IF;

  INSERT INTO inscricoes_palestra (usuario_id, palestra_id, status_fila, status_presenca)
  VALUES (p_usuario_id, p_palestra_id, v_status_fila, 'INSCRITO')
  RETURNING * INTO v_nova_inscricao;

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
      WHEN v_status_fila = 'CONFIRMADO' THEN 'Inscricao confirmada com sucesso!'
      ELSE format('Voce esta na lista de espera (posicao %s)', v_posicao_fila)
    END
  );
END;
$$;
