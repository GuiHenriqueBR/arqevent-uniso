-- Remove coluna qr_expiration_seconds da tabela palestras
-- QR Code agora é fixo (gerado uma vez na criação, não rotaciona mais)
ALTER TABLE palestras DROP COLUMN IF EXISTS qr_expiration_seconds;
