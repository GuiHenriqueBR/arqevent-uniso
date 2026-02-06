-- Adicionar campo para timer de regeneração do QR Code
-- qr_expiration_seconds: tempo em segundos para o QR Code expirar e regenerar automaticamente

ALTER TABLE public.palestras
ADD COLUMN IF NOT EXISTS qr_expiration_seconds INTEGER DEFAULT 60;

-- Adicionar campo para carga horária em minutos (mais preciso)
-- carga_horaria_minutos: quando preenchido, tem prioridade sobre carga_horaria (em horas)

ALTER TABLE public.palestras
ADD COLUMN IF NOT EXISTS carga_horaria_minutos INTEGER DEFAULT NULL;

-- Migrar dados existentes: converter carga_horaria (horas) para minutos
UPDATE public.palestras 
SET carga_horaria_minutos = carga_horaria * 60 
WHERE carga_horaria_minutos IS NULL AND carga_horaria IS NOT NULL;

-- Índice para otimizar consultas por evento com qr_expiration
CREATE INDEX IF NOT EXISTS idx_palestras_qr_expiration 
ON public.palestras(evento_id, qr_expiration_seconds);

-- Comentários para documentação
COMMENT ON COLUMN public.palestras.qr_expiration_seconds IS 'Tempo em segundos para regeneração automática do QR Code (padrão: 60)';
COMMENT ON COLUMN public.palestras.carga_horaria_minutos IS 'Carga horária em minutos. Quando preenchido, tem prioridade sobre carga_horaria.';
