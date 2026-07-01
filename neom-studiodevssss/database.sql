-- ============================================================
--  Neom Studio — Database setup script (Supabase / PostgreSQL)
--  انسخ الملف ده كله والصقه في: Supabase ← SQL Editor ← New query
--  ثم اضغط RUN مرة واحدة. هيعمل كل الجداول والتخزين تلقائيًا.
-- ============================================================

-- ------- 1) جدول الحسابات (المطورين والإدارة) -------
create table if not exists profiles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  specialization text not null,
  age          text,
  discord      text,
  whatsapp     text not null,
  roblox       text,
  country      text,
  password     text not null,
  rank         text not null default 'مطور',   -- مطور / اداري / مالك
  verified     boolean not null default false,
  banned       boolean not null default false,
  ban_reason   text default '',
  kicked       boolean not null default false,
  kick_reason  text default '',
  created_at   timestamptz not null default now()
);

-- منع تكرار الاسم / الرقم / اسم روبلكس / ديسكورد (كل واحد لازم يكون فريد)
create unique index if not exists uq_profiles_name     on profiles (lower(trim(name)));
create unique index if not exists uq_profiles_whatsapp on profiles (whatsapp);
create unique index if not exists uq_profiles_roblox   on profiles (lower(trim(roblox)));
create unique index if not exists uq_profiles_discord  on profiles (lower(trim(discord)));

-- ------- 2) التحذيرات -------
create table if not exists warnings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  reason     text not null,
  created_at timestamptz not null default now()
);

-- ------- 3) المهام -------
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  image_url   text,
  assigned_to uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ------- 4) أسعار ومدد المهمة (متعددة لكل مهمة) -------
create table if not exists task_tiers (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  label      text,
  price      numeric not null,
  deadline   timestamptz not null,
  sort_order int default 0
);

-- ------- 5) ملفات المهمة (المرفقة من الإدارة) -------
create table if not exists task_files (
  id      uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  name    text not null,
  url     text not null
);

-- ------- 6) التسليمات (تنفيذ المطور للمهمة) -------
create table if not exists submissions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references tasks(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  submitted_at timestamptz not null default now()
);

-- ------- 7) ملفات التسليم (صور + ملفات) -------
create table if not exists submission_files (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  name          text not null,
  url           text not null,
  is_image      boolean default false
);

-- ============================================================
--  قاعدة "Yaro" = مالك تلقائيًا (وبيتفعّل حسابه فورًا)
-- ============================================================
create or replace function auto_owner() returns trigger as $$
begin
  if lower(trim(new.name)) = 'yaro' then
    new.rank := 'مالك';
    new.verified := true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_auto_owner on profiles;
create trigger trg_auto_owner
  before insert on profiles
  for each row execute function auto_owner();

-- ============================================================
--  التخزين (Storage) لرفع الصور والملفات من الجهاز
-- ============================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- سياسات التخزين: تسمح برفع/قراءة/حذف الملفات داخل bucket اسمه uploads
drop policy if exists "neom_read_uploads"   on storage.objects;
drop policy if exists "neom_insert_uploads" on storage.objects;
drop policy if exists "neom_update_uploads" on storage.objects;
drop policy if exists "neom_delete_uploads" on storage.objects;

create policy "neom_read_uploads"   on storage.objects for select using (bucket_id = 'uploads');
create policy "neom_insert_uploads" on storage.objects for insert with check (bucket_id = 'uploads');
create policy "neom_update_uploads" on storage.objects for update using (bucket_id = 'uploads');
create policy "neom_delete_uploads" on storage.objects for delete using (bucket_id = 'uploads');

-- ============================================================
--  صلاحيات الوصول للجداول من خلال مفتاح الموقع (anon key)
--  (إعداد مبسّط — اقرأ ملاحظة الأمان في README.md)
-- ============================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

-- تعطيل RLS على الجداول (إعداد مبسّط عشان المفتاح العام يقدر يقرأ ويكتب)
alter table profiles          disable row level security;
alter table warnings          disable row level security;
alter table tasks             disable row level security;
alter table task_tiers        disable row level security;
alter table task_files        disable row level security;
alter table submissions       disable row level security;
alter table submission_files  disable row level security;

-- تم ✔  دلوقتي ارجع لملف js/config.js وحط رابط المشروع والمفتاح.
