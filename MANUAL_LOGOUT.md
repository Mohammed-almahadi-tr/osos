# 🚪 Manual Logout Instructions

## If the Logout Button Doesn't Work

Follow these steps to manually logout and access the login page:

---

## ✅ Method 1: Browser Console (Fastest)

**Step 1: Open Browser Console**
```
Press F12
Or right-click → Inspect → Console tab
```

**Step 2: Run This Command**
```javascript
localStorage.clear(); sessionStorage.clear(); window.location.href='/login'
```

**Step 3: Press Enter**
- You'll be logged out immediately
- Redirected to login page

---

## ✅ Method 2: Clear Browser Data

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cookies and other site data"
3. Select "Cached images and files"
4. Click "Clear data"
5. Go to: `http://localhost:5173/login`

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cookies" and "Cache"
3. Click "Clear Now"
4. Go to: `http://localhost:5173/login`

---

## ✅ Method 3: Incognito/Private Window

**Open a new incognito window:**
```
Chrome/Edge: Ctrl + Shift + N
Firefox: Ctrl + Shift + P
```

**Then go to:**
```
http://localhost:5173/login
```

You'll start fresh without any cached session.

---

## ✅ Method 4: Direct URL Access

**Simply type in the address bar:**
```
http://localhost:5173/login
```

**If it redirects back to inactive page:**
1. Open Console (F12)
2. Run: `localStorage.clear()`
3. Try the URL again

---

## 🔧 After Logging Out

Once you're on the login page:

**Step 1: Create Admin User in Supabase**
1. Go to: https://supabase.com/dashboard/project/vgtdqsbaiyaftqrmhhvg
2. Authentication → Users → Add User
3. Email: `admin@system.local`
4. Password: `Admin123!`
5. ✅ Check "Auto Confirm User"
6. Create User

**Step 2: Set Role**
1. Table Editor → profiles
2. Find the new user
3. Set `role` = `admin`
4. Set `username` = `admin`
5. Save

**Step 3: Login**
1. Go back to login page
2. Username: `admin@system.local`
3. Password: `Admin123!`
4. Login

---

## 📋 Quick Commands Reference

**Complete logout:**
```javascript
localStorage.clear(); 
sessionStorage.clear(); 
window.location.href='/login'
```

**Check current user:**
```javascript
console.log(localStorage.getItem('osos-app-auth-token-v3'))
```

**Force reload:**
```javascript
window.location.reload(true)
```

---

## ⚠️ Why the Button Might Not Work

Possible reasons:
1. JavaScript error preventing execution
2. React Router navigation issue
3. Supabase signOut hanging
4. Browser blocking the redirect

**Solution:** Use the manual console method - it always works!

---

## ✅ Success Indicators

You'll know you're logged out when:
- ✅ You see the login page
- ✅ No user info in console
- ✅ Can type username/password
- ✅ No automatic redirects

---

**Fastest Method:** 
Press F12, paste this, press Enter:
```javascript
localStorage.clear(); window.location.href='/login'
```

Done! 🎉
