import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import clsx from 'clsx';

const EmployeeLayout = () => {
    const { profile, signOut } = useAuth();
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
        <div dir="rtl" className="bg-surface text-on-surface min-h-screen overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={clsx(
                "fixed top-0 h-full w-72 bg-zinc-900 text-zinc-400 flex flex-col py-8 px-4 z-50 shadow-2xl transition-transform duration-300 ease-in-out menu-scrollbar",
                isMobileMenuOpen ? "right-0" : "-right-72 md:right-0"
            )}>
                <div className="flex items-center justify-between mb-12 px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-container text-2xl md:text-3xl">school</span>
                        </div>
                        <div>
                            <h2 className="text-amber-500 font-bold text-lg md:text-xl leading-tight">معهد التدريب</h2>
                            <p className="text-[10px] md:text-xs text-zinc-500">نظام الموظفين</p>
                        </div>
                    </div>
                    <button onClick={closeMobileMenu} className="md:hidden text-zinc-400 hover:text-white bg-white/5 p-2 rounded-lg">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto w-full custom-scrollbar">
                    <NavLink onClick={closeMobileMenu} to="/employee/dashboard" className={({ isActive }) => 
                        clsx("flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "hover:bg-white/5 hover:text-white"
                        )
                    }>
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="font-medium text-sm md:text-base">لوحة القيادة</span>
                    </NavLink>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                    <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 hover:text-white transition-all">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined">settings</span>
                            <span className="font-medium text-sm md:text-base">الإعدادات</span>
                        </div>
                    </button>
                    <button onClick={() => { closeMobileMenu(); handleSignOut(); }} className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-error/80 hover:bg-error/10 hover:text-error transition-all">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined">logout</span>
                            <span className="font-medium text-sm md:text-base">تسجيل الخروج</span>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="md:mr-72 min-h-screen transition-all duration-300 pb-12">
                {/* Top Navigation Bar */}
                <header className="fixed top-0 left-0 right-0 md:right-72 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-zinc-100 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg bg-surface-container-low text-zinc-700 hover:bg-zinc-200 transition-colors">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    <div className="flex-1 max-w-xl mx-4 hidden md:block">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
                            <input type="text" className="w-full bg-surface-container-high border-none rounded-xl py-2.5 pr-12 pl-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="ابحث عن التقارير، الدورات..." />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 flex-row-reverse">
                        <div className="flex items-center gap-3 border-l border-zinc-100 pl-2 md:pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-zinc-900 leading-tight">{profile?.username || 'الموظف'}</p>
                                <p className="text-[10px] text-zinc-500 font-medium">موظف</p>
                            </div>
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-primary-container bg-surface-container flex items-center justify-center text-primary font-bold text-sm">
                                {profile?.username?.charAt(0).toUpperCase() || 'E'}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <div className="relative cursor-pointer hover:bg-zinc-50 p-2 rounded-full transition-colors hidden sm:block">
                                <span className="material-symbols-outlined text-[20px] text-zinc-500">settings</span>
                            </div>
                            <div className="relative cursor-pointer hover:bg-zinc-50 p-2 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-[20px] text-zinc-500">notifications</span>
                                <span className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="pt-[88px] md:pt-28 px-4 md:px-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default EmployeeLayout;
