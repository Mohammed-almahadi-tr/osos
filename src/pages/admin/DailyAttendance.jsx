import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import toast from 'react-hot-toast';

const DailyAttendance = () => {
    const { selectedCompanyId } = useCompany();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRows, setAttendanceRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchAttendance();
        }
    }, [selectedCompanyId, date]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            // Fetch employees for company
            const { data: employeesData, error: empError } = await supabase
                .from('employees')
                .select('id, name, job_title')
                .eq('company_id', selectedCompanyId);
            
            if (empError) throw empError;

            const empIds = employeesData.map(e => e.id);

            // Fetch attendance for those employees on selected date
            const { data: attendanceData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .in('employee_id', empIds)
                .eq('date', date);

            if (attError) throw attError;

            // Merge Data
            const rows = employeesData.map(emp => {
                const attRec = attendanceData.find(a => a.employee_id === emp.id);
                return {
                    ...emp,
                    attendance_id: attRec?.id,
                    check_in: attRec?.check_in,
                    check_out: attRec?.check_out,
                };
            });

            setAttendanceRows(rows);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error("حدث خطأ أثناء جلب سجلات الحضور");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold headline-font text-zinc-900">سجل الحضور اليومي</h2>
                    <p className="text-sm text-zinc-500">متابعة حضور وانصراف الموظفين بالتفصيل</p>
                </div>
                <div className="flex gap-4 items-center w-full md:w-auto">
                    <div className="relative">
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer" 
                        />
                    </div>
                    <button className="bg-surface-container hover:bg-zinc-200 text-zinc-700 font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">download</span>
                        تصدير
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-zinc-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-surface-container-low text-zinc-600 font-bold">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-xl">الموظف</th>
                                <th className="px-6 py-4">القسم/دور</th>
                                <th className="px-6 py-4">وقت الدخول</th>
                                <th className="px-6 py-4">وقت الخروج</th>
                                <th className="px-6 py-4 rounded-tl-xl text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-10 font-bold text-primary">جاري التحميل...</td></tr>
                            ) : attendanceRows.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-zinc-500">لا يوجد موظفين مسجلين بناءً على الفلتر</td></tr>
                            ) : (
                                attendanceRows.map((row) => {
                                    const hasCheckedIn = !!row.check_in;
                                    const hasCheckedOut = !!row.check_out;

                                    return (
                                        <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {row.name.charAt(0)}
                                                    </div>
                                                    <p className="font-bold text-zinc-900">{row.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 font-medium">{row.job_title}</td>
                                            <td className="px-6 py-4 font-bold text-zinc-900">{formatTime(row.check_in)}</td>
                                            <td className="px-6 py-4 font-bold text-zinc-900">{formatTime(row.check_out)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {hasCheckedIn && !hasCheckedOut && (
                                                    <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-xs font-bold rounded-full">حاضر الآن</span>
                                                )}
                                                {hasCheckedOut && (
                                                    <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-xs font-bold rounded-full">منصرف</span>
                                                )}
                                                {!hasCheckedIn && (
                                                    <span className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full">غائب</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyAttendance;
