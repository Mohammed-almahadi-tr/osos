-- تفعيل إضافة pg_cron (إذا لم تكن مفعلة مسبقاً)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- دالة لتوليد المهام اليومية من المهام الدورية
CREATE OR REPLACE FUNCTION generate_daily_tasks()
RETURNS void AS $$
BEGIN
  -- إدراج مهام جديدة بناءً على المهام الدورية
  -- نقوم بجدولة كل المهام الموجودة في جدول recurring_tasks لتكون مهام لليوم الحالي
  INSERT INTO tasks (
    project_id,
    employee_id,
    name,
    description,
    duration_hours,
    status
  )
  SELECT
    project_id,
    employee_id,
    name,
    description,
    duration_hours,
    'pending'
  FROM
    recurring_tasks;
    
  -- ملاحظة: تم التبسيط هنا لتوليد كل المهام يومياً. 
  -- إذا أردت دعم cron_expression بشكل كامل لكل مهمة على حدة، سيتطلب ذلك معالجة معقدة داخل Postgres
  -- أو يفضل استخدام Supabase Edge Functions أو خدمة خارجية (مثل GitHub Actions) لاستدعاء API مخصص يقرأ حقل cron_expression.
END;
$$ LANGUAGE plpgsql;

-- جدولة المهمة لتعمل كل يوم الساعة 12 منتصف الليل (بتوقيت الخادم)
SELECT cron.schedule(
  'generate-daily-tasks',
  '0 0 * * *', -- كل يوم في منتصف الليل
  $$SELECT generate_daily_tasks()$$
);

-- لعرض الوظائف المجدولة:
-- SELECT * FROM cron.job;

-- لحذف الجدولة:
-- SELECT cron.unschedule('generate-daily-tasks');
