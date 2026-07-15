-- 1. Update profiles role check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role in ('admin', 'employee', 'company_manager'));

-- 2. Create company_managers table
CREATE TABLE public.company_managers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.company_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company_managers" ON public.company_managers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "company_managers viewable by authenticated" ON public.company_managers FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- 3. Create projects table
CREATE TABLE public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage projects" ON public.projects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM public.company_managers WHERE user_id = auth.uid() AND company_id = projects.company_id)
);

CREATE POLICY "Employees can view company projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND company_id = projects.company_id)
);

-- 4. Create tasks table
CREATE TABLE public.tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  duration_hours numeric(5,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  employee_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage tasks" ON public.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM public.projects p JOIN public.company_managers cm ON p.company_id = cm.company_id WHERE p.id = tasks.project_id AND cm.user_id = auth.uid())
);

CREATE POLICY "Employees can view and update their own tasks" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND id = tasks.employee_id)
);

CREATE POLICY "Employees can update their own tasks" ON public.tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND id = tasks.employee_id)
);

-- 5. Create recurring_tasks table
CREATE TABLE public.recurring_tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  duration_hours numeric(5,2),
  cron_expression text NOT NULL, -- e.g., '0 8 * * *'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage recurring tasks" ON public.recurring_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM public.projects p JOIN public.company_managers cm ON p.company_id = cm.company_id WHERE p.id = recurring_tasks.project_id AND cm.user_id = auth.uid())
);

CREATE POLICY "Employees can view their recurring tasks" ON public.recurring_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND id = recurring_tasks.employee_id)
);

-- 6. Add policies for company_managers to access employees and attendance
CREATE POLICY "Managers can view company employees" ON public.employees FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.company_managers WHERE user_id = auth.uid() AND company_id = employees.company_id)
);

CREATE POLICY "Managers can insert company employees" ON public.employees FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.company_managers WHERE user_id = auth.uid() AND company_id = employees.company_id)
);

CREATE POLICY "Managers can update company employees" ON public.employees FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.company_managers WHERE user_id = auth.uid() AND company_id = employees.company_id)
);

CREATE POLICY "Managers can delete company employees" ON public.employees FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.company_managers WHERE user_id = auth.uid() AND company_id = employees.company_id)
);

-- Assuming attendance table has employee_id linking to employees
CREATE POLICY "Managers can view company attendance" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees e JOIN public.company_managers cm ON e.company_id = cm.company_id WHERE e.id = attendance.employee_id AND cm.user_id = auth.uid())
);

-- 7. Edge Function / pg_cron hook for recurring tasks
-- This simple function copies all recurring tasks to the tasks table.
CREATE OR REPLACE FUNCTION generate_daily_tasks()
RETURNS void AS $$
BEGIN
  INSERT INTO public.tasks (project_id, employee_id, name, description, duration_hours, status)
  SELECT project_id, employee_id, name, description, duration_hours, 'pending'
  FROM public.recurring_tasks;
END;
$$ LANGUAGE plpgsql;

-- If pg_cron extension is enabled, you can run this:
-- SELECT cron.schedule('generate_daily_tasks_cron', '0 0 * * *', 'SELECT generate_daily_tasks()');
