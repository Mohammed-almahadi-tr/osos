-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (linked to auth.users)
-- We use public.profiles to store user metadata
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  role text not null check (role in ('admin', 'employee')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. Companies
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.companies enable row level security;
create policy "Companies are viewable by everyone." on companies for select using (true);
create policy "Only admins can insert companies." on companies for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Insert dummy companies
insert into public.companies (name) values ('معهد التدريب - الفرع الرئيسي'), ('معهد التدريب - الفرع الغربي');

-- 3. Courses Table
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

-- 4. Company Courses Junction Table
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

-- 5. Employees
create table public.employees (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  email text,
  national_id text,
  job_title text,
  salary numeric(10, 2),
  company_id uuid references public.companies(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id)
);

alter table public.employees enable row level security;
create policy "Admins can view all employees" on employees for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert employees" on employees for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update employees" on employees for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete employees" on employees for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Employees can view own data" on employees for select using (
  auth.uid() = user_id
);

-- 6. Attendance
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references public.employees(id) not null,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (employee_id, date) -- One attendance record per employee per day
);

alter table public.attendance enable row level security;
-- Admins can query and edit all
create policy "Admins can view all attendance" on attendance for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can manage attendance" on attendance for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Employees can manage their own
create policy "Employees can view own attendance" on attendance for select using (
  exists (select 1 from public.employees where id = attendance.employee_id and user_id = auth.uid())
);
create policy "Employees can insert own attendance" on attendance for insert with check (
  exists (select 1 from public.employees where id = attendance.employee_id and user_id = auth.uid())
);
create policy "Employees can update own attendance" on attendance for update using (
  exists (select 1 from public.employees where id = attendance.employee_id and user_id = auth.uid())
);

-- Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
