import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import toast from 'react-hot-toast';

const MonthlyReports = () => {
    const { selectedCompanyId } = useCompany();
    // Default to current year and month (e.g., "2024-03")
    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchReport();
        }
    }, [selectedCompanyId, month]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Get all employees for the company
            const { data: employeesData, error: empError } = await supabase
                .from('employees')
                .select('id, name, job_title')
                .eq('company_id', selectedCompanyId);
            
            if (empError) throw empError;

            const empIds = employeesData.map(e => e.id);

            // Fetch attendance for the selected month
            // format: YYYY-MM
            const [year, mnth] = month.split('-');
            const startDate = `${year}-${mnth}-01`;
            // Calculate end date of the month
            const nextMonth = Number(mnth) === 12 ? 1 : Number(mnth) + 1;
            const nextYear = Number(mnth) === 12 ? Number(year) + 1 : Number(year);
            const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            const { data: attendanceData, error: attError } = await supabase
                .from('attendance')
                .select('employee_id, date, check_in, check_out')
                .in('employee_id', empIds)
                .gte('date', startDate)
                .lt('date', endDate);

            if (attError) throw attError;

            // Compute statistics
            const totalWorkDays = getWorkDaysInMonth(Number(year), Number(mnth) - 1);

            const report = employeesData.map(emp => {
                const empAtt = attendanceData.filter(a => a.employee_id === emp.id);
                const daysPresent = empAtt.filter(a => a.check_in).length;
                const daysAbsent = Math.max(0, totalWorkDays - daysPresent);
                const totalHours = empAtt.reduce((acc, curr) => {
                    if (curr.check_in && curr.check_out) {
                        const inTime = new Date(curr.check_in);
                        const outTime = new Date(curr.check_out);
                        const diffMins = (outTime - inTime) / (1000 * 60);
                        return acc + (diffMins / 60);
                    }
                    return acc;
                }, 0);

                const rate = totalWorkDays > 0 ? (daysPresent / totalWorkDays) * 100 : 0;

                return {
                    ...emp,
                    daysPresent,
                    daysAbsent,
                    totalHours: totalHours.toFixed(1),
                    completionRate: rate.toFixed(1)
                };
            });

            setReportData(report);
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("حدث خطأ أثناء تحميل التقرير الشهري");
        } finally {
            setLoading(false);
        }
    };

    // Helper: calculate working days in a month (excluding Friday/Saturday assume standard ME weekend)
    function getWorkDaysInMonth(year, monthIndex) {
        let days = 0;
        const date = new Date(year, monthIndex, 1);
        while (date.getMonth() === monthIndex) {
            const day = date.getDay();
            // 5 = Friday, 6 = Saturday
            if (day !== 5 && day !== 6) {
                days++;
            }
            date.setDate(date.getDate() + 1);
        }
        return days;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold headline-font text-zinc-900">التقارير الشهرية</h2>
                    <p className="text-sm text-zinc-500">إحصائيات شاملة لحضور وانصراف الموظفين</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <input 
                            type="month" 
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-48" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-zinc-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-surface-container-low text-zinc-600 font-bold">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-xl">الموظف</th>
                                <th className="px-6 py-4">أيام الحضور</th>
                                <th className="px-6 py-4">أيام الغياب</th>
                                <th className="px-6 py-4">إجمالي الساعات</th>
                                <th className="px-6 py-4 rounded-tl-xl">نسبة الالتزام</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-10 font-bold text-primary">جاري إعداد التقرير...</td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-zinc-500">لا يوجد موظفين مسجلين</td></tr>
                            ) : (
                                reportData.map((row) => (
                                    <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {row.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">{row.name}</p>
                                                    <p className="text-xs text-zinc-500">{row.job_title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">{row.daysPresent} يوم</td>
                                        <td className="px-6 py-4 font-bold text-error">{row.daysAbsent} يوم</td>
                                        <td className="px-6 py-4 font-bold text-zinc-900">{row.totalHours} ساعة</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-zinc-900 w-12">{row.completionRate}%</span>
                                                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${row.completionRate}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReports;
