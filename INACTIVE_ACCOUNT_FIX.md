# 🔧 Fix: Inactive Account Error

## What You're Seeing

The app shows "حساب غير مفعل" (Inactive Account) with your user information and a logout button.

---

## ✅ Quick Fix (5 Minutes)

### Step 1: Click the Logout Button

On the inactive account page, click:
```
تسجيل الخروج والعودة للدخول
(Logout and Return to Login)
```

This will log you out and take you to the login page.

---

### Step 2: Create Admin User in Supabase

**Go to Supabase Dashboard:**
```
https://supabase.com/dashboard/project/vgtdqsbaiyaftqrmhhvg
```

**Option A: Create New Admin User (Recommended)**

1. Click **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   ```
   Email: admin@system.local
   Password: Admin123!
   ✅ Auto Confirm User (CHECK THIS!)
   ```
4. Click **Create User**
5. Go to **Table Editor** → **profiles**
6. Find the new user
7. Edit the row:
   ```
   role: admin
   username: admin
   ```
8. Click **Save**

**Option B: Fix Your Existing User**

1. Go to **Table Editor** → **profiles**
2. Find your user (use the email shown on the error page)
3. Edit the row:
   ```
   role: admin  (or employee)
   username: your-username
   ```
4. Click **Save**

---

### Step 3: Login

1. Go back to the login page
2. Login with:
   ```
   Username: admin@system.local
   Password: Admin123!
   ```
   (Or your existing credentials if you fixed your user)

3. You should now see the company selection page! ✅

---

## 🔍 Why This Happens

The error occurs when:
1. ✅ User exists in Supabase Auth
2. ❌ User doesn't have a profile with a valid role
3. ❌ Or profile role is not 'admin' or 'employee'

---

## 📋 SQL Quick Fix

If you prefer SQL, run this in **SQL Editor**:

**Make a specific user admin:**
```sql
-- Replace with your email
UPDATE profiles 
SET role = 'admin', username = 'admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);
```

**Or make all users admins:**
```sql
UPDATE profiles SET role = 'admin';
```

---

## 🎯 What the New Error Page Shows

The improved error page now displays:
- ✅ Your email address
- ✅ Your user ID
- ✅ Step-by-step activation instructions
- ✅ Proper logout button that actually works
- ✅ Clear guidance on what to do next

---

## ⚠️ Important Notes

### About Roles

Valid roles are:
- `admin` - Full access to admin dashboard
- `employee` - Access to employee dashboard only

Any other value (or no value) will show the inactive account error.

### About the Logout Button

The new logout button:
- ✅ Properly signs you out from Supabase
- ✅ Clears all session data
- ✅ Redirects to login page
- ✅ Allows you to login with a different account

---

## 🧪 Testing

After fixing the role:

1. **Logout** from the inactive account page
2. **Login** with your credentials
3. **Should see** company selection page (if admin)
4. **Or** employee dashboard (if employee)

---

## 📞 Still Having Issues?

### Issue: Can't find my user in profiles table

**Solution:**
1. Check **Authentication** → **Users** for your email
2. Copy the user ID
3. Go to **Table Editor** → **profiles**
4. Search for that ID
5. If not found, the trigger didn't fire - create manually:

```sql
INSERT INTO profiles (id, username, role)
VALUES (
  'YOUR_USER_ID_HERE',
  'admin',
  'admin'
);
```

### Issue: Logout button doesn't work

**Solution:**
1. Open browser console (F12)
2. Run:
```javascript
localStorage.clear()
sessionStorage.clear()
window.location.href = '/login'
```

### Issue: Still shows inactive after setting role

**Solution:**
1. Make sure you saved the changes in Supabase
2. Logout completely
3. Clear browser cache (Ctrl+Shift+R)
4. Login again

---

## ✅ Success Checklist

You'll know it's fixed when:
- [ ] Can click logout button
- [ ] Redirected to login page
- [ ] Can login with credentials
- [ ] See company selection (admin) or dashboard (employee)
- [ ] No more "inactive account" error

---

## 🎉 After Fixing

Once you have an admin account:
1. ✅ Select or create a company
2. ✅ Add employees
3. ✅ Manage attendance
4. ✅ View reports
5. ✅ Full system access

---

**The inactive account page now has a working logout button and clear instructions!**
