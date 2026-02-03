-- Permitir que ADMIN/ORGANIZADOR visualizem todos os perfis
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;

CREATE POLICY "Admins podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo IN ('ADMIN', 'ORGANIZADOR')
    )
  );
