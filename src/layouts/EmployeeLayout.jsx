import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const EmployeeLayout = () => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div dir="rtl" className="bg-surface text-on-surface min-h-screen">
            {/* Sidebar Navigation */}
            <aside className="fixed right-0 top-0 h-full w-72 bg-zinc-900 text-zinc-400 flex flex-col py-8 px-4 z-50 shadow-2xl overflow-y-auto">
                <div className="flex items-center gap-4 mb-12 px-2">
                    <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary-container text-3xl">school</span>
                    </div>
                    <div>
                        <h2 className="text-amber-500 font-bold text-xl leading-tight">معهد التدريب</h2>
                        <p className="text-xs text-zinc-500">نظام الموظفين</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavLink to="/employee/dashboard" className={({ isActive }) => 
                        clsx("flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer",
                            isActive ? "bg-white/10 text-amber-500 border-r-4 border-amber-500" : "hover:bg-white/5 hover:text-white"
                        )
                    }>
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="font-medium">لوحة القيادة</span>
                    </NavLink>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 hover:text-white transition-all">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="font-medium">الإعدادات</span>
                    </button>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-error/80 hover:bg-error/10 hover:text-error transition-all">
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-medium">تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="mr-72 min-h-screen">
                {/* Top Navigation Bar */}
                <header className="fixed top-0 left-0 right-72 z-40 bg-white/80 backdrop-blur-md shadow-sm">
                    <div className="flex flex-row-reverse justify-between items-center px-8 py-4">
                        <div className="flex items-center gap-6">
                            <div className="relative cursor-pointer hover:bg-zinc-50 p-2 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-zinc-500">notifications</span>
                                <span className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                            </div>
                            <div className="relative cursor-pointer hover:bg-zinc-50 p-2 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-zinc-500">settings</span>
                            </div>
                            <div className="flex items-center gap-3 mr-4 border-r pr-6 border-zinc-100 flex-row-reverse">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-zinc-900 leading-tight">{profile?.username || 'الموظف'}</p>
                                    <p className="text-[10px] text-zinc-500 font-medium">موظف</p>
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-surface-container flex items-center justify-center text-primary font-bold">
                                    {profile?.username?.charAt(0).toUpperCase() || 'E'}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 max-w-xl">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                                <input type="text" className="w-full bg-surface-container-high border-none rounded-xl py-2.5 pr-12 pl-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="ابحث عن التقارير، الدورات، أو الموظفين..." />
                            </div>
                        </div>
                    </div>
                    <div className="h-[1px] bg-zinc-100 w-full"></div>
                </header>

                <div className="pt-28 px-10 pb-12">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default EmployeeLayout;
