# 🚨 Quick Fix: "حساب غير مفعل" Error

## The Problem
You're seeing this error because your user account exists in Supabase but doesn't have a role assigned in the `profiles` table.

## The Solution (5 minutes)

### Step 1: Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/vgtdqsbaiyaftqrmhhvg

### Step 2: Create Admin User
1. Click **Authentication** (left sidebar)
2. Click **Users** tab
3. Click **Add User** button
4. Fill in:
   ```
   Email: admin@system.local
   Password: Admin123!
   ✅ Auto Confirm User (CHECK THIS!)
   ```
5. Click **Create User**

### Step 3: Set Role in Profiles Table
1. Click **Table Editor** (left sidebar)
2. Click **profiles** table
3. Find your newly created user
4. Click the row to edit
5. Set these values:
   ```
   role: admin
   username: admin
   ```
6. Click **Save**

### Step 4: Login
Go back to your app and login with:
```
Username: admin@system.local
Password: Admin123!
```

---

## Alternative: Fix Existing User

If you already have a user but can't login:

### Using Supabase Dashboard:
1. **Authentication** → **Users** → Copy the user's ID (UUID)
2. **Table Editor** → **profiles** → Find row with that ID
3. Edit the row and set `role` to `admin` or `employee`
4. Save

### Using SQL Editor:
```sql
-- Replace with your user's email
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@system.local'
);
```

---

## Test Your Fix

Open browser console (F12) and run:
```javascript
testSupabase()
```

This will verify everything is working correctly.

---

## Need More Help?
See `SUPABASE_SETUP.md` for detailed troubleshooting.
