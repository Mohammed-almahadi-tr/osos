import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import clsx from 'clsx';

const AdminLayout = () => {
    const { profile, signOut } = useAuth();
    const { selectedCompanyId } = useCompany();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div dir="rtl" className="bg-surface text-on-surface antialiased overflow-x-hidden">
            {/* Sidebar Container */}
            <aside className="fixed right-0 top-0 h-full w-72 bg-zinc-900 z-50 shadow-2xl flex flex-col py-8 px-4 rtl">
                <div className="flex items-center gap-4 mb-10 px-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                    </div>
                    <div>
                        <h2 className="text-amber-500 font-bold text-2xl headline-font tracking-tight">معهد التدريب</h2>
                        <p className="text-zinc-500 text-xs font-medium">الإدارة العامة</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavLink to="/admin/dashboard" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="font-medium">لوحة القيادة</span>
                    </NavLink>

                    <NavLink to="/admin/attendance" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span className="font-medium">الحضور اليومي</span>
                    </NavLink>

                    <NavLink to="/admin/reports" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">assessment</span>
                        <span className="font-medium">التقارير الشهرية</span>
                    </NavLink>

                    <NavLink to="/admin/employees" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">group</span>
                        <span className="font-medium">قائمة الموظفين</span>
                    </NavLink>

                    <NavLink to="/admin/add-employee" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">person_add</span>
                        <span className="font-medium">إضافة موظف</span>
                    </NavLink>

                    <div className="h-[1px] bg-zinc-800 my-2"></div>

                    <NavLink to="/admin/companies" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">corporate_fare</span>
                        <span className="font-medium">إدارة الشركات</span>
                    </NavLink>

                    <NavLink to="/admin/add-company" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">add_business</span>
                        <span className="font-medium">إضافة شركة</span>
                    </NavLink>
                </nav>

                <div className="mt-auto pt-6 space-y-4">
                    <button className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all">
                        تحميل التقرير اليومي
                    </button>
                    <div className="h-[1px] bg-zinc-800 my-4"></div>
                    
                    {/* Switch Company button mapped to settings style button */}
                    <button onClick={() => navigate('/admin/company-selection')} className="w-full flex items-center gap-4 px-4 py-3 text-zinc-400 hover:text-white transition-all">
                        <span className="material-symbols-outlined">domain</span>
                        <span className="font-medium">تغيير الشركة</span>
                    </button>

                    <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3 text-zinc-400 hover:text-error transition-all">
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-medium">تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="mr-72 min-h-screen">
                {/* Top Navigation */}
                <header className="fixed top-0 left-0 right-72 z-40 bg-white/80 backdrop-blur-md shadow-sm flex flex-row-reverse justify-between items-center px-8 py-4">
                    <div className="flex items-center gap-6 flex-row-reverse">
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-zinc-900 font-bold text-sm">{profile?.username || 'مدير النظام'}</p>
                                <p className="text-zinc-500 text-xs text-left">مدير النظام</p>
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-surface-container flex items-center justify-center text-primary font-bold">
                                {profile?.username?.charAt(0).toUpperCase() || 'M'}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-full hover:bg-zinc-50 transition-colors active:scale-95 duration-200">
                                <span className="material-symbols-outlined text-zinc-500">notifications</span>
                            </button>
                            <button className="p-2 rounded-full hover:bg-zinc-50 transition-colors active:scale-95 duration-200">
                                <span className="material-symbols-outlined text-zinc-500">settings</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 max-w-md mx-8">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">search</span>
                            <input type="text" className="w-full pr-10 pl-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm transition-all" placeholder="البحث عن موظف أو تقرير..." />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <h1 className="text-xl font-black text-zinc-900 tracking-tight headline-font">لوحة التحكم</h1>
                    </div>
                </header>

                <div className="pt-24 px-8 pb-12">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
