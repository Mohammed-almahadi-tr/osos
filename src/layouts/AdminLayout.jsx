import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useState } from 'react';
import clsx from 'clsx';

const AdminLayout = () => {
    const { profile, signOut } = useAuth();
    const { selectedCompanyId } = useCompany();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div dir="rtl" className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar Container */}
            <aside className={clsx(
                "fixed top-0 h-full w-72 bg-zinc-900 z-50 shadow-2xl flex flex-col py-8 px-4 rtl transition-transform duration-300 ease-in-out",
                isMobileMenuOpen ? "right-0" : "-right-72 md:right-0"
            )}>
                <div className="flex items-center justify-between mb-10 px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                        </div>
                        <div>
                            <h2 className="text-amber-500 font-bold text-xl md:text-2xl headline-font tracking-tight">معهد التدريب</h2>
                            <p className="text-zinc-500 text-[10px] md:text-xs font-medium">الإدارة العامة</p>
                        </div>
                    </div>
                    <button onClick={closeMobileMenu} className="md:hidden text-zinc-400 hover:text-white bg-white/5 p-2 rounded-lg">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
                    <NavLink onClick={closeMobileMenu} to="/admin/dashboard" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-primary/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="font-medium text-sm md:text-base">لوحة القيادة</span>
                    </NavLink>

                    <NavLink onClick={closeMobileMenu} to="/admin/attendance" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-primary/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span className="font-medium text-sm md:text-base">الحضور اليومي</span>
                    </NavLink>

                    <NavLink onClick={closeMobileMenu} to="/admin/reports" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-primary/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">assessment</span>
                        <span className="font-medium text-sm md:text-base">التقارير الشهرية</span>
                    </NavLink>

                    <NavLink onClick={closeMobileMenu} to="/admin/employees" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-primary/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">group</span>
                        <span className="font-medium text-sm md:text-base">قائمة الموظفين</span>
                    </NavLink>

                    <NavLink onClick={closeMobileMenu} to="/admin/add-employee" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-primary/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">person_add</span>
                        <span className="font-medium text-sm md:text-base">إضافة موظف</span>
                    </NavLink>

                    <div className="h-[1px] bg-zinc-800 my-2"></div>

                    <NavLink onClick={closeMobileMenu} to="/admin/companies" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-primary/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">corporate_fare</span>
                        <span className="font-medium text-sm md:text-base">إدارة الشركات</span>
                    </NavLink>

                    <NavLink onClick={closeMobileMenu} to="/admin/add-company" className={({ isActive }) => 
                        clsx("flex items-center gap-4 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-primary/10 text-amber-500 border-r-4 border-amber-500" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )
                    }>
                        <span className="material-symbols-outlined">add_business</span>
                        <span className="font-medium text-sm md:text-base">إضافة شركة</span>
                    </NavLink>
                </nav>

                <div className="mt-auto pt-6 border-t border-zinc-800 space-y-3">
                    {/* Switch Company button */}
                    <button onClick={() => { closeMobileMenu(); navigate('/admin/company-selection'); }} className="w-full flex items-center justify-between px-4 py-3 text-zinc-400 hover:text-white bg-white/5 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">domain</span>
                            <span className="font-medium text-sm">تغيير الشركة</span>
                        </div>
                    </button>

                    <button onClick={() => { closeMobileMenu(); handleSignOut(); }} className="w-full flex items-center justify-between px-4 py-3 text-error/80 hover:text-error bg-error/10 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span className="font-medium text-sm">تسجيل الخروج</span>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="md:mr-72 min-h-screen transition-all duration-300 pb-12">
                {/* Top Navigation */}
                <header className="fixed top-0 left-0 right-0 md:right-72 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg bg-surface-container-low text-zinc-700 hover:bg-zinc-200 transition-colors">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-lg md:text-xl font-black text-zinc-900 tracking-tight headline-font hidden sm:block">لوحة التحكم</h1>
                    </div>
                    
                    <div className="flex-1 max-w-sm mx-4 hidden md:block">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm group-focus-within:text-primary transition-colors">search</span>
                            <input type="text" className="w-full pr-10 pl-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm transition-all" placeholder="البحث عن موظف..." />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 flex-row-reverse">
                        <div className="flex items-center gap-3 border-l border-zinc-200 pl-2 md:pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-zinc-900 font-bold text-sm leading-tight">{profile?.username || 'مدير النظام'}</p>
                                <p className="text-zinc-500 text-[10px] text-left">مدير النظام</p>
                            </div>
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-primary-container bg-surface-container flex items-center justify-center text-primary font-bold text-sm">
                                {profile?.username?.charAt(0).toUpperCase() || 'M'}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors hidden sm:block">
                                <span className="material-symbols-outlined text-[20px]">settings</span>
                            </button>
                            <button className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors relative">
                                <span className="material-symbols-outlined text-[20px]">notifications</span>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full pointer-events-none"></span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="pt-[88px] md:pt-24 px-4 md:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
