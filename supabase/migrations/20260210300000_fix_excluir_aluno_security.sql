-- Fix: Adicionar verificação de permissão do chamador na função excluir_aluno
-- Antes: qualquer usuário autenticado podia chamar a função
-- Agora: apenas ADMIN pode chamar

CREATE OR REPLACE FUNCTION excluir_aluno(p_aluno_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_caller_tipo TEXT;
BEGIN
  -- 0. Verificar se o chamador é ADMIN
  SELECT tipo INTO v_caller_tipo
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_tipo IS NULL OR v_caller_tipo != 'ADMIN' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas administradores podem excluir alunos'
    );
  END IF;

  -- 1. Verificar se o aluno existe
  SELECT id, nome, tipo INTO v_profile
  FROM public.profiles
  WHERE id = p_aluno_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Aluno não encontrado'
    );
  END IF;

  -- 2. Não permitir excluir admins
  IF v_profile.tipo = 'ADMIN' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não é possível excluir um administrador'
    );
  END IF;

  -- 3. Deletar inscrições em palestras
  DELETE FROM public.inscricoes_palestra
  WHERE usuario_id = p_aluno_id;

  -- 4. Deletar inscrições em eventos
  DELETE FROM public.inscricoes_evento
  WHERE usuario_id = p_aluno_id;

  -- 5. Deletar certificados
  DELETE FROM public.certificados
  WHERE usuario_id = p_aluno_id;

  -- 6. Deletar notificações
  DELETE FROM public.notificacoes
  WHERE usuario_id = p_aluno_id;

  -- 7. Deletar perfil
  DELETE FROM public.profiles
  WHERE id = p_aluno_id;

  -- 8. Deletar usuário do auth (cascateia tudo restante)
  DELETE FROM auth.users
  WHERE id = p_aluno_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Aluno "%s" excluído com sucesso', v_profile.nome)
  );
END;
$$;
