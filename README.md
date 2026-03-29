# نظام التدريب الذكي - Technical Documentation (React + Supabase)

This document provides a comprehensive overview of the application's architecture, core components, and the function of each script. The application was converted from static HTML/CSS to a fully functional React (Vite) Single Page Application backed by PostgreSQL via Supabase.

---

## 🏗️ 1. Core Setup & Architecture

### `index.html` & `src/main.jsx`
- **What it does:** The entry point of the React application. 
- **How it works:** `main.jsx` imports standard Global CSS (`index.css` which includes pure Tailwind imports and custom `.glass-card` classes). It wraps the entire `App` inside two major State Providers: `<AuthProvider>` and `<CompanyProvider>`.

### `src/App.jsx`
- **What it does:** The central Router component utilizing `react-router-dom`. It is responsible for defining all accessible URLs.
- **How it works:** It acts as a traffic controller. The custom `<ProtectedRoute>` guard checks if a user is authenticated via the context logic, preventing a non-user from entering `/admin` or `/employee`. If a user is not an admin, it routes them to employee sections (and vice-versa).

---

## 🔑 2. Context & State Management

### `src/context/AuthContext.jsx`
- **What it does:** Manages the user's login session securely and globally.
- **How it does it:** 
  1. Utilizes `useEffect` to call `supabase.auth.getSession()` on initial load.
  2. Subscribes to browser auth state changes via `onAuthStateChange`.
  3. When an authenticated user is detected, it runs `fetchProfile()` to query the `public.profiles` table and determine if the user is an `admin` or an `employee`.
  4. Returns `isAdmin` and `isEmployee` boolean flags to any component that calls `useAuth()`.

### `src/context/CompanyContext.jsx`
- **What it does:** Tracks what "Company" or "Branch" an Admin is actively managing.
- **How it does it:** It utilizes React's `useState` and initializes by checking `localStorage.getItem('selected_company_id')`. When an admin explicitly picks a company, it pushes the ID to local browser storage so the admin's preference persists across hard browser reloads.

---

## 🌐 3. Backend Integration

### `src/services/supabase.js`
- **What it does:** Initializes the official `@supabase/supabase-js` client SDK.
- **How it works:** Pulls the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the `.env` file and uses `createClient` to export a global `supabase` object utilized by all pages for data querying.

### `supabase_schema.sql`
- **What it does:** The raw SQL script executed in the backend to scaffold your exact database setup.
- **Tables Built:**
  - `profiles`: Tied securely to Supabase's native `auth.users` table. Uses a **PostgreSQL Trigger** `handle_new_user()` to automatically construct a profile row anytime a new user signs up.
  - `companies`: A simple list of available branches/companies.
  - `employees`: Stores heavy HR metrics (Salaries, National IDs).
  - `attendance`: Stores daily time-punch metrics mapped to the employee. (Restricted to 1 punch per day).
- **Row Level Security (RLS)**: Enforces policies so employees can *only* interact with their own punch cards, while admins can access broad data arrays.

---

## 🖥️ 4. Layout Shells

### `src/layouts/AdminLayout.jsx` & `src/layouts/EmployeeLayout.jsx`
- **What it does:** Provides the unified graphical shell (Sidebar and Top Navbar) around changing page content.
- **How it does it:** Uses React Router's `<Outlet />` component. The sidebar and header remain fixed to the viewport while the internal `<Outlet />` injects the correct `Page` component depending on the URL (e.g., `/admin/dashboard` vs `/admin/reports`).

---

## 📄 5. Page Components & Logic

### `src/pages/Login.jsx`
- **Function:** The front door of the application.
- **How it works:** Accepts a username/email and password. Employs `supabase.auth.signInWithPassword()` to authenticate. If successful, `AuthContext` instantly perceives the change and forces a layout redirection based on user permissions.

### `src/pages/admin/CompanySelection.jsx`
- **Function:** Serves as a forced intermediary screen for newly logged-in admins.
- **How it works:** Queries the `companies` table using `supabase.from('companies').select('*')`. Renders each company on a UI card. When `اختيار (Select)` is clicked, it runs `setSelectedCompanyId(company.id)`, caching the choice, and forwards the Admin to their dashboard.

### `src/pages/admin/AdminDashboard.jsx`
- **Function:** A high-level view showing overarching business metrics.
- **How it works:** Automatically fetches the total counts of Employees matching `selectedCompanyId`. Computes real-time "Today's Attendance" by extracting attendance rows matching the current `Date()`.

### `src/pages/admin/AddEmployee.jsx` & `src/pages/admin/EmployeesList.jsx`
- **Function:** The core HR interface (Create, Read, Update, Delete) for Employee data.
- **How it works:** 
  - `AddEmployee` aggregates controlled input states (`name`, `job_title`, etc) into a JSON bundle, running an asynchronous `.insert()` into the `employees` table natively mapping it to the `selectedCompanyId`.
  - `EmployeesList` displays all retrieved lists in an HTML dynamically padded `table`, processing a live `.filter()` on the rendered array to allow instantly responsive 'Search by Name/ID' mechanics.

### `src/pages/admin/DailyAttendance.jsx`
- **Function:** Allows Admins to track minute-to-minute movement.
- **How it works:** Uses a `join` methodology by taking `company_id` to grab all Employees. It then searches the `attendance` table for rows corresponding to `employee.id` bounded exactly to the HTML `<input type="date">` provided by the admin. 

### `src/pages/admin/MonthlyReports.jsx`
- **Function:** Evaluates heavy aggregated metric processing (Days present vs Total Hours vs Adherence).
- **How it works:** 
  - Looks at exactly 1 month.
  - Computes `getWorkDaysInMonth()` to isolate just Weekdays computationally.
  - Generates `totalHours` mathematically by finding the JavaScript Date discrepancy between `check_out` timestamp and `check_in` timestamp, extracting the exact minutes, and summing them into an output array object.

### `src/pages/employee/EmployeeDashboard.jsx`
- **Function:** The direct terminal for standard workers to 'Punch In' and 'Punch Out'.
- **How it works:** 
  1. Translates the active auth UUID into a local database `employee.id` via `.eq('user_id', user.id)`.
  2. Queries `attendance` for today. If no row exists, it enables the **Check In** button.
  3. Pushing **Check In** executes an `.insert()` to `attendance` with the `check_in` timestamp.
  4. Once checked in, it shifts UI configuration to allow **Check Out**, running an `.update()` against the exact same returning row.
