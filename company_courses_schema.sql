-- 1. Courses Table
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  duration text, -- e.g., "30 hours", "3 days"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for courses
alter table public.courses enable row level security;

-- Policies for courses
create policy "Courses are viewable by everyone." on courses for select using (true);
create policy "Only admins can manage courses." on courses for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Insert dummy courses for testing
insert into public.courses (name, duration) values 
('دورة الأمن والسلامة المهنية', '30 ساعة'),
('إدارة المشاريع الاحترافية', '5 أيام'),
('الإسعافات الأولية', 'يوم واحد');

-- 2. Company Courses Junction Table
create table public.company_courses (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (company_id, course_id) -- Prevent duplicate assignments
);

-- Enable RLS for company_courses
alter table public.company_courses enable row level security;

-- Policies for company_courses
create policy "company_courses viewable by authenticated users" on company_courses for select using (
  auth.role() = 'authenticated'
);

create policy "Admins can manage company_courses" on company_courses for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
