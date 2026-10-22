-- Vela - Supabase tablo şeması
-- Supabase SQL Editor'de çalıştırın.

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  amount numeric not null,
  category text,
  merchant text,
  source text,
  raw_text text,
  created_at timestamptz default now()
);

create table if not exists health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  metric_type text not null,
  value numeric not null,
  unit text,
  recorded_at timestamptz default now()
);

create table if not exists ai_agent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  prompt text not null,
  response text,
  created_at timestamptz default now()
);

alter table expenses enable row level security;
alter table health_metrics enable row level security;
alter table ai_agent_logs enable row level security;

create policy "Users manage own expenses" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own health_metrics" on health_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own ai_agent_logs" on ai_agent_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
