# Supabase Setup & Troubleshooting Guide

## 🚀 Quick Setup

### 1. Verify Environment Variables

Check your `.env` file contains:
```env
VITE_SUPABASE_URL=https://vgtdqsbaiyaftqrmhhvg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Run Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `vgtdqsbaiyaftqrmhhvg`
3. Go to **SQL Editor**
4. Copy and paste the entire content of `supabase_schema.sql`
5. Click **Run** to execute

### 3. Verify Tables Created

In Supabase Dashboard → **Table Editor**, you should see:
- ✅ profiles
- ✅ companies
- ✅ employees
- ✅ attendance

---

## 🔧 Fixing "حساب غير مفعل" (Inactive Account) Error

This error means the user doesn't have a proper role in the `profiles` table.

### Solution 1: Create User with Role (Recommended)

Use Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - Email: `admin@system.local`
   - Password: `Admin123!`
   - Auto Confirm User: ✅ (check this)
4. Click **Create User**
5. Go to **Table Editor** → **profiles**
6. Find the newly created user
7. Edit the row and set:
   - `role` = `admin`
   - `username` = `admin`
8. Save

### Solution 2: Fix Existing User Role

If you already have a user but they can't login:

1. Go to **Authentication** → **Users**
2. Copy the user's UUID (e.g., `abc123-def456-...`)
3. Go to **Table Editor** → **profiles**
4. Find the row with matching `id`
5. Edit and set `role` to either:
   - `admin` (for administrators)
   - `employee` (for regular employees)
6. Save

### Solution 3: Use SQL to Fix Role

In **SQL Editor**, run:

```sql
-- Update role for specific user by email
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@system.local'
);
```

---

## 🧪 Testing Connection

### Method 1: Browser Console

1. Open your app in browser
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Run:
```javascript
testSupabase()
```

This will check:
- ✅ Environment variables
- ✅ Database connection
- ✅ Auth status
- ✅ Profiles table

### Method 2: Create Test Admin

In browser console:
```javascript
createTestAdmin('admin@system.local', 'Admin123!')
```

---

## 📋 Common Issues & Solutions

### Issue 1: "Invalid login credentials"

**Cause**: User doesn't exist or password is wrong

**Solution**:
1. Verify user exists in Supabase Dashboard → Authentication → Users
2. If not, create user using Solution 1 above
3. Make sure to check "Auto Confirm User" when creating

### Issue 2: "حساب غير مفعل" (Inactive Account)

**Cause**: User exists but has no role or invalid role in profiles table

**Solution**: Follow "Fixing Inactive Account Error" section above

### Issue 3: Profile not created automatically

**Cause**: The trigger `handle_new_user()` didn't fire

**Solution**: Manually create profile:
```sql
INSERT INTO profiles (id, username, role)
VALUES (
  'USER_UUID_HERE',
  'admin',
  'admin'
);
```

### Issue 4: Connection timeout

**Cause**: Slow internet or Supabase service issue

**Solution**:
1. Check your internet connection
2. Verify Supabase project is active (not paused)
3. Check Supabase status: https://status.supabase.com/

### Issue 5: RLS (Row Level Security) blocking queries

**Cause**: User doesn't have permission to access data

**Solution**: Verify RLS policies in `supabase_schema.sql` are applied correctly

---

## 🎯 Quick Test Checklist

Before using the app, verify:

- [ ] `.env` file exists with correct credentials
- [ ] `supabase_schema.sql` has been executed
- [ ] Tables exist: profiles, companies, employees, attendance
- [ ] At least one user exists in Authentication
- [ ] User has a matching profile with valid role (admin/employee)
- [ ] User is confirmed (or auto-confirm is enabled)

---

## 🔐 Creating Users for Testing

### Admin User
```javascript
// In browser console
createTestAdmin('admin@system.local', 'Admin123!')
```

Then in Supabase Dashboard → Table Editor → profiles:
- Set `role` = `admin`

### Employee User
```javascript
// In browser console
createTestAdmin('employee@system.local', 'Employee123!')
```

Then in Supabase Dashboard → Table Editor → profiles:
- Set `role` = `employee`

---

## 📞 Still Having Issues?

1. Check browser console for detailed error messages (F12 → Console)
2. Check Supabase Dashboard → Logs for backend errors
3. Verify your Supabase project is not paused (free tier pauses after inactivity)
4. Make sure you're using the correct project URL and anon key

---

## 🔍 Debug Mode

The app now includes detailed console logging:
- 🔐 Auth events
- ✅ Successful operations
- ❌ Errors with details
- ⚠️ Warnings

Open browser console (F12) to see real-time logs while using the app.
