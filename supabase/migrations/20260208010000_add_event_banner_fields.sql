-- Add fields for featured banner, status overrides, gallery, CTAs, and sharing
alter table public.eventos
  add column if not exists banner_galeria jsonb,
  add column if not exists destaque boolean default false,
  add column if not exists status_manual text default 'AUTO',
  add column if not exists cta_label text,
  add column if not exists cta_sec_label text,
  add column if not exists cta_sec_url text,
  add column if not exists compartilhar_url text;

-- Optional status check constraint (safe to rerun)
alter table public.eventos
  drop constraint if exists eventos_status_manual_check;

alter table public.eventos
  add constraint eventos_status_manual_check
  check (status_manual in ('AUTO', 'ABERTO', 'ENCERRADO', 'AO_VIVO'));
