-- Corrige policy de leitura de perfis para ADMIN/ORGANIZADOR sem recursão de RLS

-- Função helper (security definer) para checar papel do usuário
create or replace function public.is_admin_or_organizador()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo public.user_role;
begin
  select tipo into v_tipo from public.profiles where id = auth.uid();
  return v_tipo in ('ADMIN','ORGANIZADOR');
end;
$$;

-- Policy para admins (evita recursão com a função acima)
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
CREATE POLICY "Admins podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_organizador());
