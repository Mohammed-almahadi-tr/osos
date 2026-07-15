-- 1. إضافة حقل is_ai لجدول الموظفين
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT false;

-- تحديث الموظفين القدامى ليكونوا false
UPDATE employees SET is_ai = false WHERE is_ai IS NULL;

-- 2. إنشاء وظيفة (Function) لمحاكاة عمل وكلاء الذكاء الاصطناعي
CREATE OR REPLACE FUNCTION simulate_ai_agents_daily()
RETURNS void AS $$
DECLARE
    emp RECORD;
    t RECORD;
    task_count INT;
    simulated_time TIMESTAMP;
BEGIN
    -- التكرار على جميع الموظفين الذين تم تحديدهم كذكاء اصطناعي
    FOR emp IN SELECT id FROM employees WHERE is_ai = true LOOP
        
        -- تعيين وقت البدء الافتراضي لليوم (الساعة 8 صباحاً بتوقيت الخادم)
        simulated_time := CURRENT_DATE + interval '8 hours';
        
        -- تسجيل الحضور للموظف الافتراضي إذا لم يكن مسجلاً
        INSERT INTO attendance (employee_id, date, check_in)
        VALUES (emp.id, CURRENT_DATE, simulated_time)
        ON CONFLICT (employee_id, date) DO NOTHING;

        -- تهيئة عداد المهام
        task_count := 0;

        -- المرور على مهام الموظف الافتراضي لليوم والتي لا تزال معلقة
        FOR t IN SELECT id, name, duration_hours FROM tasks WHERE employee_id = emp.id AND date = CURRENT_DATE AND status = 'pending' ORDER BY created_at ASC LOOP
            
            -- تقدم الوقت لمحاكاة الانتهاء من المهمة
            -- نستخدم duration_hours إن وجد، وإلا ساعة واحدة كافتراضي
            simulated_time := simulated_time + (COALESCE(t.duration_hours, 1) * interval '1 hour');

            -- تحديث حالة المهمة لتكون منجزة وكتابة وصف
            UPDATE tasks 
            SET status = 'completed',
                employee_notes = 'تم تنفيذ [' || t.name || '] آليًا بواسطة الوكيل الذكي وفق المعايير المحددة.',
                updated_at = NOW()
            WHERE id = t.id;
            
            task_count := task_count + 1;
        END LOOP;

        -- تسجيل الانصراف التلقائي بعد الانتهاء من كافة المهام
        -- نتقدم 5 دقائق إضافية ليكون وقت الخروج منطقياً
        simulated_time := simulated_time + interval '5 minutes';
        
        UPDATE attendance
        SET check_out = simulated_time
        WHERE employee_id = emp.id AND date = CURRENT_DATE;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. جدولة الوظيفة لتعمل يومياً الساعة 12:05 ظهراً كـ Cron Job (لكي تجد المهام قد تم توليدها مسبقاً)
-- تأكد من تشغيل إضافة pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'simulate-ai-agents',
  '5 12 * * *', -- الساعة 12:05 ظهراً بتوقيت الخادم كل يوم
  $$SELECT simulate_ai_agents_daily()$$
);
