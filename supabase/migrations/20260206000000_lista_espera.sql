-- Adicionar campos para lista de espera na tabela inscricoes_palestra
-- status_fila: CONFIRMADO (tem vaga), LISTA_ESPERA (aguardando vaga), CANCELADO
-- posicao_fila: posição na lista de espera (null se confirmado)

-- Adicionar coluna status_fila
ALTER TABLE public.inscricoes_palestra
ADD COLUMN IF NOT EXISTS status_fila VARCHAR(20) DEFAULT 'CONFIRMADO'
CHECK (status_fila IN ('CONFIRMADO', 'LISTA_ESPERA', 'CANCELADO'));

-- Adicionar coluna posicao_fila
ALTER TABLE public.inscricoes_palestra
ADD COLUMN IF NOT EXISTS posicao_fila INTEGER DEFAULT NULL;

-- Índice para buscar rapidamente inscrições por status
CREATE INDEX IF NOT EXISTS idx_inscricoes_palestra_status_fila 
ON public.inscricoes_palestra(palestra_id, status_fila);

-- Função para promover automaticamente da lista de espera
CREATE OR REPLACE FUNCTION public.promover_lista_espera()
RETURNS TRIGGER AS $$
DECLARE
  v_palestra_id UUID;
  v_vagas INTEGER;
  v_confirmados INTEGER;
  v_proximo RECORD;
BEGIN
  -- Só executa se foi cancelamento ou mudança de status para CANCELADO
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.status_fila = 'CANCELADO') THEN
    
    v_palestra_id := COALESCE(OLD.palestra_id, NEW.palestra_id);
    
    -- Buscar vagas da palestra
    SELECT vagas INTO v_vagas FROM public.palestras WHERE id = v_palestra_id;
    
    -- Contar confirmados atuais
    SELECT COUNT(*) INTO v_confirmados 
    FROM public.inscricoes_palestra 
    WHERE palestra_id = v_palestra_id AND status_fila = 'CONFIRMADO';
    
    -- Se há vaga disponível, promover o próximo da lista
    IF v_confirmados < v_vagas THEN
      SELECT * INTO v_proximo
      FROM public.inscricoes_palestra
      WHERE palestra_id = v_palestra_id AND status_fila = 'LISTA_ESPERA'
      ORDER BY posicao_fila ASC
      LIMIT 1;
      
      IF v_proximo IS NOT NULL THEN
        UPDATE public.inscricoes_palestra
        SET status_fila = 'CONFIRMADO', posicao_fila = NULL
        WHERE id = v_proximo.id;
        
        -- Reordenar posições da fila
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY posicao_fila) as new_pos
          FROM public.inscricoes_palestra
          WHERE palestra_id = v_palestra_id AND status_fila = 'LISTA_ESPERA'
        )
        UPDATE public.inscricoes_palestra ip
        SET posicao_fila = r.new_pos
        FROM ranked r
        WHERE ip.id = r.id;
        
        -- Criar notificação para o usuário promovido
        INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados)
        SELECT 
          v_proximo.usuario_id,
          'vaga_liberada',
          'Vaga liberada!',
          'Uma vaga foi liberada e você foi inscrito na palestra.',
          jsonb_build_object('palestra_id', v_palestra_id);
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para cancelamento (DELETE)
DROP TRIGGER IF EXISTS trg_promover_lista_espera_delete ON public.inscricoes_palestra;
CREATE TRIGGER trg_promover_lista_espera_delete
AFTER DELETE ON public.inscricoes_palestra
FOR EACH ROW
EXECUTE FUNCTION public.promover_lista_espera();

-- Trigger para update de status
DROP TRIGGER IF EXISTS trg_promover_lista_espera_update ON public.inscricoes_palestra;
CREATE TRIGGER trg_promover_lista_espera_update
AFTER UPDATE OF status_fila ON public.inscricoes_palestra
FOR EACH ROW
WHEN (OLD.status_fila <> 'CANCELADO' AND NEW.status_fila = 'CANCELADO')
EXECUTE FUNCTION public.promover_lista_espera();

-- Atualizar inscrições existentes para CONFIRMADO
UPDATE public.inscricoes_palestra 
SET status_fila = 'CONFIRMADO' 
WHERE status_fila IS NULL;
