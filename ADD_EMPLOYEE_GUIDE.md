# 📝 Quick Guide: Adding an Employee with Login Access

## Before You Start

Make sure you're logged in as an admin and have selected a company.

---

## Step-by-Step Process

### 1️⃣ Navigate to Add Employee
```
Admin Dashboard → Employees List → Add Employee Button
```

### 2️⃣ Fill Personal Information Section

**Required Fields:**
- ✅ الاسم الرباعي (Full Name) - e.g., "أحمد محمد عبدالله"
- ✅ الهوية الوطنية (National ID) - e.g., "1012345678"
- ✅ رقم الجوال (Phone) - e.g., "0512345678"
- ✅ المسمى الوظيفي (Job Title) - e.g., "مبرمج"
- ✅ الراتب الأساسي (Salary) - e.g., "5000"

**Optional Field:**
- البريد الإلكتروني (Email) - e.g., "ahmed@company.com"
  - If left empty, system generates: `username@system.local`

---

### 3️⃣ Set Login Credentials Section

**Username (اسم المستخدم):**
- Enter a unique username (3+ characters)
- Examples: `ahmed.mohammed`, `a.mohammed`, `ahmed123`
- System checks availability in real-time:
  - ✅ Green border = Available
  - ❌ Red border = Already taken
  - 🔄 Checking...

**Password (كلمة المرور):**
- Enter a secure password (6+ characters)
- Recommended: Mix letters and numbers
- Click the eye icon 👁️ to show/hide password
- Examples: `Ahmed123!`, `SecurePass2024`

---

### 4️⃣ Submit the Form

Click the green button: **"حفظ بيانات الموظف"** (Save Employee Data)

---

### 5️⃣ Save the Credentials

After successful creation, you'll see a success message:

```
✅ تم إضافة الموظف بنجاح!

اسم المستخدم: ahmed.mohammed
كلمة المرور: Ahmed123!

يرجى حفظ هذه البيانات وتسليمها للموظف
```

**Important:** 
- Copy these credentials immediately
- Write them down or save in a secure location
- Provide them to the employee
- The employee will use these to login

---

## 🎯 What Happens Next?

### For the Admin:
1. ✅ Employee appears in the employees list
2. ✅ Employee can be managed (edit/delete)
3. ✅ Employee attendance can be tracked

### For the Employee:
1. ✅ Can login at `/login` using provided credentials
2. ✅ Access employee dashboard
3. ✅ Check in/out for attendance
4. ✅ View personal attendance history

---

## 📋 Example: Complete Form

```
المعلومات الشخصية (Personal Information):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
الاسم الرباعي: أحمد محمد عبدالله علي
الهوية الوطنية: 1012345678
البريد الإلكتروني: ahmed@company.com (optional)
رقم الجوال: 0512345678
المسمى الوظيفي: مبرمج واجهات
الراتب الأساسي: 8000

بيانات تسجيل الدخول (Login Credentials):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اسم المستخدم: ahmed.mohammed ✓ متاح
كلمة المرور: Ahmed@2024 👁️
```

---

## ✅ Validation Checklist

Before submitting, ensure:
- [ ] All required fields are filled
- [ ] Username is at least 3 characters
- [ ] Username shows green checkmark (available)
- [ ] Password is at least 6 characters
- [ ] Phone number is valid format
- [ ] Salary is a number
- [ ] Company is selected

---

## ⚠️ Common Mistakes to Avoid

### ❌ Username Already Taken
**Problem:** Red border on username field
**Solution:** Choose a different username

### ❌ Password Too Short
**Problem:** Error message about password length
**Solution:** Use at least 6 characters

### ❌ No Company Selected
**Problem:** Error "يرجى اختيار شركة أولاً"
**Solution:** Go back and select a company first

### ❌ Forgot to Save Credentials
**Problem:** Can't provide login info to employee
**Solution:** Check Supabase Dashboard → Authentication → Users to find the email, then reset password if needed

---

## 🔐 Security Best Practices

### For Admins:
1. ✅ Use strong passwords (mix of letters, numbers, symbols)
2. ✅ Don't use easily guessable usernames
3. ✅ Save credentials securely
4. ✅ Provide credentials to employee privately
5. ✅ Advise employee to change password after first login (future feature)

### For Employees:
1. ✅ Keep credentials confidential
2. ✅ Don't share login with others
3. ✅ Logout after use on shared computers
4. ✅ Report lost credentials immediately

---

## 🧪 Quick Test

Want to test the feature?

1. **Add a test employee:**
   ```
   Name: موظف تجريبي
   National ID: 1000000000
   Phone: 0500000000
   Job Title: اختبار
   Salary: 1000
   Username: test.employee
   Password: Test123!
   ```

2. **Verify creation:**
   - Check employees list
   - Logout from admin
   - Login with test credentials
   - Should see employee dashboard

3. **Cleanup:**
   - Login as admin
   - Delete test employee
   - (User account remains in Supabase but won't affect system)

---

## 📞 Need Help?

- **Username not available?** Try adding numbers or dots
- **Form not submitting?** Check browser console (F12) for errors
- **Employee can't login?** Verify credentials are correct
- **Other issues?** See `EMPLOYEE_USER_CREATION.md` for detailed troubleshooting

---

## 🎉 Success!

Once you see the success message and the employee appears in the list, you're done! The employee can now login and start using the system.

**Next Steps:**
1. Provide credentials to employee
2. Show employee how to login
3. Explain check-in/check-out process
4. Monitor attendance in admin dashboard
