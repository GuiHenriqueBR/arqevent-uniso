-- Atualizar função handle_new_user para incluir ra, telefone, turno e semestre

-- Adicionar coluna telefone na tabela profiles (se não existir)
alter table public.profiles add column if not exists telefone text;

-- Atualizar a função para incluir os novos campos dos metadados do usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nome, ra, telefone, turno, semestre, tipo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'ra', ''),
    coalesce(new.raw_user_meta_data->>'telefone', ''),
    coalesce(new.raw_user_meta_data->>'turno', ''),
    coalesce(new.raw_user_meta_data->>'semestre', ''),
    'ALUNO'
  )
  on conflict (id) do update set
    nome = coalesce(excluded.nome, public.profiles.nome),
    ra = coalesce(nullif(excluded.ra, ''), public.profiles.ra),
    telefone = coalesce(nullif(excluded.telefone, ''), public.profiles.telefone),
    turno = coalesce(nullif(excluded.turno, ''), public.profiles.turno),
    semestre = coalesce(nullif(excluded.semestre, ''), public.profiles.semestre),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;
