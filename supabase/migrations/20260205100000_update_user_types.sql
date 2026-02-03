-- Script para atualizar tipos de usuários
-- Executar no Supabase Dashboard > SQL Editor

-- 1. Alterar gui.leitedepaula@hotmail.com para ALUNO
UPDATE profiles 
SET tipo = 'ALUNO'
WHERE email = 'gui.leitedepaula@hotmail.com';

-- 2. Verificar se caaus.uniso@gmail.com já existe e atualizar para ADMIN
UPDATE profiles 
SET tipo = 'ADMIN'
WHERE email = 'caaus.uniso@gmail.com';

-- Verificar resultado
SELECT id, email, nome, tipo FROM profiles 
WHERE email IN ('caaus.uniso@gmail.com', 'gui.leitedepaula@hotmail.com');
