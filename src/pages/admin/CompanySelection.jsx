import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import toast from 'react-hot-toast';

const CompanySelection = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setSelectedCompanyId } = useCompany();
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompanies();
        // Clear previously selected company
        setSelectedCompanyId(null);
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');
            
            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('حدث خطأ أثناء جلب الشركات');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCompany = (companyId) => {
        setSelectedCompanyId(companyId);
        toast.success('تم تحديد الشركة بنجاح');
        navigate('/admin/dashboard');
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div dir="rtl" className="bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen">
            {/* TopAppBar */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 z-40 bg-white/80 backdrop-blur-md shadow-[0_8px_24px_rgba(26,28,28,0.06)] flex flex-row-reverse items-center justify-between px-4 md:px-8 w-full">
                <div className="flex items-center gap-6">
                    <button onClick={handleSignOut} className="text-sm font-bold text-error flex items-center gap-2 hover:bg-error/10 px-4 py-2 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                        تسجيل الخروج
                    </button>
                    <div className="flex items-center gap-3 border-r border-outline-variant/30 pr-4">
                        <div className="text-left flex-col items-end hidden sm:flex">
                            <p className="text-sm font-bold text-on-surface">{profile?.username || 'مدير النظام'}</p>
                            <p className="text-xs text-zinc-500">مدير النظام</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold border-2 border-primary-container">
                            {profile?.username?.charAt(0).toUpperCase() || 'A'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 font-headline hidden sm:block">نظام التحكم الشامل</h1>
                </div>
            </header>

            {/* Main Content Canvas */}
            <main className="pt-24 md:pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
                <section className="mb-8 md:mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <span className="text-primary font-bold tracking-widest uppercase text-[10px] md:text-xs mb-2 block">Admin Portal</span>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-3 md:mb-4 font-headline leading-tight">اختيار الشركة</h2>
                            <p className="text-zinc-500 max-w-lg leading-relaxed text-sm md:text-base">يرجى اختيار المؤسسة التدريبية التي ترغب في إدارتها اليوم.</p>
                        </div>
                        <button 
                            onClick={() => navigate('/admin/add-company')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity w-full md:w-auto"
                        >
                            <span className="material-symbols-outlined">add</span>
                            <span>إضافة شركة جديدة</span>
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-primary font-bold">جاري تحميل الشركات...</div>
                    ) : companies.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-zinc-500">لا توجد شركات مسجلة في النظام.</div>
                    ) : (
                        companies.map((company) => (
                            <div key={company.id} className="group relative bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(26,28,28,0.06)] hover:shadow-xl transition-all duration-500 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-surface-container rounded-lg mb-6 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-3xl">corporate_fare</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-on-surface mb-2 truncate">{company.name}</h3>
                                    <p className="text-sm text-zinc-500 mb-8 leading-relaxed">إدارة بيانات الموظفين والحضور والانصراف.</p>
                                    
                                    <div className="flex items-center justify-end">
                                        <button onClick={() => handleSelectCompany(company.id)} className="editorial-gradient text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                                            اختيار
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default CompanySelection;
