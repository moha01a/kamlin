-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.
-- يسمح للموقع بإنشاء حجز فقط، ويقصر القراءة والتعديل والحذف على المستخدم المسجل.

create table if not exists public.bookings (
  id text primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  service text not null,
  area text not null default '',
  notes text not null default '',
  status text not null default 'جديد',
  assigned_to text not null default '',
  follow_up date,
  quote numeric(12,2),
  warranty text not null default '',
  source text not null default 'الموقع',
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "public can create bookings" on public.bookings;
create policy "public can create bookings"
on public.bookings for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 2 and 120
  and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15
  and char_length(trim(service)) between 2 and 160
);

drop policy if exists "authenticated admins can read bookings" on public.bookings;
create policy "authenticated admins can read bookings"
on public.bookings for select
to authenticated
using ((auth.jwt() ->> 'email') = 'kamlin.eg2025@gmail.com');

drop policy if exists "authenticated admins can update bookings" on public.bookings;
create policy "authenticated admins can update bookings"
on public.bookings for update
to authenticated
using ((auth.jwt() ->> 'email') = 'kamlin.eg2025@gmail.com')
with check ((auth.jwt() ->> 'email') = 'kamlin.eg2025@gmail.com');

drop policy if exists "authenticated admins can delete bookings" on public.bookings;
create policy "authenticated admins can delete bookings"
on public.bookings for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'kamlin.eg2025@gmail.com');

create index if not exists bookings_created_at_idx
on public.bookings (created_at desc);

alter table public.bookings replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end $$;
