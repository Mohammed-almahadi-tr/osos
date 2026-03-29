import { useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { supabase } from '../../services/supabase';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { selectedCompanyId } = useCompany();
    const [stats, setStats] = useState({ employees: 0, attendanceToday: 0, absentToday: 0 });
    const [loading, setLoading] = useState(true);

    if (!selectedCompanyId) {
        return <Navigate to="/admin/company-selection" replace />;
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Get employees count
                const { count: empCount } = await supabase
                    .from('employees')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', selectedCompanyId);
                
                // Get attendance for today
                const today = new Date().toISOString().split('T')[0];
                const { count: attCount } = await supabase
                    .from('attendance')
                    .select('id, employees!inner(company_id)', { count: 'exact', head: true })
                    .eq('date', today)
                    .eq('employees.company_id', selectedCompanyId);

                setStats({
                    employees: empCount || 0,
                    attendanceToday: attCount || 0,
                    absentToday: Math.max(0, (empCount || 0) - (attCount || 0))
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedCompanyId]);

    return (
        <div className="space-y-8">
            {/* Hero Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-r-4 border-primary flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <span className="material-symbols-outlined text-primary">groups</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-zinc-500 text-sm">إجمالي الموظفين</p>
                        <h3 className="text-3xl font-black headline-font text-zinc-900 mt-1">{loading ? '...' : stats.employees}</h3>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-r-4 border-tertiary flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-tertiary/10 rounded-lg">
                            <span className="material-symbols-outlined text-tertiary">how_to_reg</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-zinc-500 text-sm">حضور اليوم</p>
                        <h3 className="text-3xl font-black headline-font text-zinc-900 mt-1">{loading ? '...' : stats.attendanceToday}</h3>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-r-4 border-error flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-error/10 rounded-lg">
                            <span className="material-symbols-outlined text-error">person_off</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-zinc-500 text-sm">الغائبون</p>
                        <h3 className="text-3xl font-black headline-font text-zinc-900 mt-1">{loading ? '...' : stats.absentToday}</h3>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-zinc-900 p-6 rounded-xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <span className="material-symbols-outlined text-primary-fixed">timer</span>
                        </div>
                    </div>
                    <div className="mt-4 relative z-10">
                        <p className="text-zinc-400 text-sm">إجمالي ساعات العمل</p>
                        <h3 className="text-3xl font-black headline-font text-primary-fixed mt-1">تحديث...</h3>
                    </div>
                </div>
            </div>

            {/* Main Layout: Content and Actions */}
            <div className="grid grid-cols-12 gap-8">
                {/* Visualization & Activity Column */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Placeholder for Analytics */}
                    <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                         <span className="material-symbols-outlined text-zinc-200 text-6xl mb-4">bar_chart</span>
                         <h4 className="text-lg font-bold text-zinc-400">تحليلات الحضور الأسبوعية - (قريباً)</h4>
                         <p className="text-sm text-zinc-400">ستتوفر بيانات الرسم البياني بمجرد تجميع النشاط الكافي</p>
                    </div>
                </div>

                {/* Quick Actions Sidebar Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-2xl shadow-xl text-white">
                        <h4 className="text-xl font-bold mb-6 headline-font tracking-tight">إجراءات سريعة</h4>
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                                        <span className="material-symbols-outlined text-primary-fixed">calendar_month</span>
                                    </div>
                                    <span className="font-medium text-sm">الحضور اليومي</span>
                                </div>
                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-white transition-colors">chevron_left</span>
                            </button>
                            
                            <button className="w-full flex items-center justify-between p-4 bg-primary rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <span className="material-symbols-outlined text-white">person_add</span>
                                    </div>
                                    <span className="font-bold text-sm">إضافة موظف جديد</span>
                                </div>
                                <span className="material-symbols-outlined text-white/50">add</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-primary-container/10 p-6 rounded-2xl border-r-4 border-primary/30">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <h5 className="font-bold text-sm text-zinc-900">نصيحة النظام</h5>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                            احرص على مراجعة تقارير الغياب يومياً لتحديث السجلات المعتمدة. يمكنك إضافة موظفين جدد من قائمة الإجراءات السريعة.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
