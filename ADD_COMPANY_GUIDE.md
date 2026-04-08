# 📝 Quick Guide: Adding and Managing Companies

## 🎯 Quick Start

### Adding a Company (30 seconds)

**Option 1: From Company Selection**
```
1. Login as admin
2. See "إضافة شركة جديدة" button
3. Click it
4. Enter company name
5. Click "حفظ الشركة"
6. Done! ✅
```

**Option 2: From Admin Dashboard**
```
1. Login and select any company
2. Click "إضافة شركة" in sidebar
3. Enter company name
4. Click "حفظ الشركة"
5. Done! ✅
```

---

## 📋 Company Name Examples

Good company names:
- ✅ معهد التدريب - الفرع الرئيسي
- ✅ معهد التدريب - الفرع الشرقي
- ✅ معهد التدريب - الفرع الغربي
- ✅ شركة التطوير التقني
- ✅ مركز الخدمات الإدارية

Bad company names:
- ❌ AB (too short)
- ❌ X (too short)
- ❌ (empty)

**Rule:** Minimum 3 characters

---

## 🔧 Managing Companies

### View All Companies
```
Sidebar → إدارة الشركات
```

### Search for Company
```
1. Go to "إدارة الشركات"
2. Use search bar at top
3. Type company name
4. Results filter automatically
```

### Edit Company Name
```
1. Go to "إدارة الشركات"
2. Find company in list
3. Click edit icon (✏️)
4. Change name
5. Click "حفظ"
```

### Delete Company
```
1. Go to "إدارة الشركات"
2. Find company in list
3. Click delete icon (🗑️)
4. Confirm deletion
5. If has employees, confirm again
```

---

## ⚠️ Important Warnings

### Deleting Companies

**Warning 1: No Employees**
```
"هل أنت متأكد من حذف الشركة؟"
(Are you sure you want to delete this company?)
```

**Warning 2: Has Employees**
```
"تحذير: يوجد X موظف مرتبط بهذه الشركة.
هل تريد المتابعة؟ سيتم حذف جميع الموظفين والبيانات المرتبطة بهم."

(Warning: X employees linked to this company.
Continue? All employees and related data will be deleted.)
```

**What Gets Deleted:**
- ❌ The company
- ❌ All employees in that company
- ❌ All attendance records for those employees
- ❌ Cannot be undone!

---

## 🎨 Navigation

### Sidebar Links

**Employee Management:**
- 📊 لوحة القيادة (Dashboard)
- 📅 الحضور اليومي (Daily Attendance)
- 📈 التقارير الشهرية (Monthly Reports)
- 👥 قائمة الموظفين (Employees List)
- ➕ إضافة موظف (Add Employee)

**Company Management:** (New!)
- 🏢 إدارة الشركات (Manage Companies)
- ➕ إضافة شركة (Add Company)

**Other:**
- 🔄 تغيير الشركة (Switch Company)
- 🚪 تسجيل الخروج (Logout)

---

## 📊 Companies List Features

### Table Columns
1. **اسم الشركة** (Company Name)
   - Shows company icon
   - Company name
   - Editable inline

2. **تاريخ الإضافة** (Date Added)
   - Shows creation date
   - Arabic format

3. **الإجراءات** (Actions)
   - Edit button (✏️)
   - Delete button (🗑️)

### Features
- ✅ Search bar
- ✅ Real-time filtering
- ✅ Inline editing
- ✅ Confirmation dialogs
- ✅ Total count display
- ✅ Empty state message
- ✅ Loading indicator

---

## 🧪 Testing Your Setup

### Test 1: Add Company
```
1. Click "إضافة شركة"
2. Enter: "شركة اختبار"
3. Click "حفظ الشركة"
4. Should redirect to company selection
5. "شركة اختبار" should appear in list ✅
```

### Test 2: Edit Company
```
1. Go to "إدارة الشركات"
2. Find "شركة اختبار"
3. Click edit icon
4. Change to: "شركة اختبار محدثة"
5. Click "حفظ"
6. Name should update ✅
```

### Test 3: Delete Company
```
1. Go to "إدارة الشركات"
2. Find "شركة اختبار محدثة"
3. Click delete icon
4. Confirm deletion
5. Company should disappear ✅
```

---

## 🔄 Complete Workflow Example

### Setting Up Multiple Branches

**Step 1: Add Main Branch**
```
1. Click "إضافة شركة"
2. Enter: "معهد التدريب - الفرع الرئيسي"
3. Save
```

**Step 2: Add East Branch**
```
1. Click "إضافة شركة"
2. Enter: "معهد التدريب - الفرع الشرقي"
3. Save
```

**Step 3: Add West Branch**
```
1. Click "إضافة شركة"
2. Enter: "معهد التدريب - الفرع الغربي"
3. Save
```

**Step 4: Select and Manage**
```
1. Go to company selection
2. See all 3 branches
3. Select one to manage
4. Add employees to that branch
5. Track attendance for that branch
```

---

## 💡 Tips & Best Practices

### Naming Conventions
- ✅ Use clear, descriptive names
- ✅ Include location if multiple branches
- ✅ Be consistent with naming pattern
- ✅ Use Arabic for better readability

### Organization
- 🏢 Create separate companies for each location
- 🏢 Or create separate companies for departments
- 🏢 Keep names short but descriptive
- 🏢 Use consistent prefixes (e.g., "معهد التدريب -")

### Safety
- ⚠️ Double-check before deleting
- ⚠️ Backup data before major changes
- ⚠️ Test with dummy companies first
- ⚠️ Understand cascade delete implications

---

## 📞 Common Questions

### Q: Can I have multiple companies?
**A:** Yes! Add as many as you need.

### Q: Can I rename a company?
**A:** Yes! Use the edit feature in "إدارة الشركات".

### Q: What happens to employees when I delete a company?
**A:** They are also deleted. You'll get a warning first.

### Q: Can I recover a deleted company?
**A:** No, deletion is permanent. Be careful!

### Q: Can employees see the companies list?
**A:** No, only admins can manage companies.

### Q: Do I need to create companies before adding employees?
**A:** Yes, employees must be assigned to a company.

---

## ✅ Checklist

Before going live:
- [ ] Added all your companies/branches
- [ ] Named them clearly and consistently
- [ ] Tested adding a company
- [ ] Tested editing a company
- [ ] Tested deleting a test company
- [ ] Understand the delete warnings
- [ ] Selected a company to start with
- [ ] Ready to add employees

---

## 🎉 You're Ready!

You can now:
- ✅ Add new companies/branches
- ✅ View all companies
- ✅ Search for companies
- ✅ Edit company names
- ✅ Delete companies safely
- ✅ Organize your system better

**Next Steps:**
1. Add your companies
2. Select a company
3. Start adding employees
4. Track attendance

---

**Need more details?** See `COMPANY_MANAGEMENT.md`

**Need help with employees?** See `ADD_EMPLOYEE_GUIDE.md`
