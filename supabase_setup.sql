-- Скрипт создания таблицы для хранения бэкапов

-- 1. Создаем таблицу backups
create table backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  data jsonb not null,
  version bigint not null,
  created_at timestamptz default now()
);

-- 2. Включаем RLS (Row Level Security) - это обязательно для защиты данных!
alter table backups enable row level security;

-- 3. Создаем политики доступа

-- Политика: Пользователь может добавлять ТОЛЬКО свои записи
create policy "Users can insert their own backups"
on backups for insert
to authenticated
with check (auth.uid() = user_id);

-- Политика: Пользователь может читать ТОЛЬКО свои записи
create policy "Users can select their own backups"
on backups for select
to authenticated
using (auth.uid() = user_id);

-- Политика: Пользователь может удалять ТОЛЬКО свои записи
create policy "Users can delete their own backups"
on backups for delete
to authenticated
using (auth.uid() = user_id);
