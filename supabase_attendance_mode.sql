-- إضافة عمود لتحديد ما إذا كانت الشركة ستستخدم نظام الحضور والانصراف الفعلي
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS use_actual_attendance BOOLEAN DEFAULT false;

-- تحديث الشركات القديمة لتكون false (على الرغم من أن DEFAULT سيقوم بذلك، كإجراء احترازي)
UPDATE companies SET use_actual_attendance = false WHERE use_actual_attendance IS NULL;
