import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [employee, setEmployee] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${yyyy}-${mm}`;
    });
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [editForm, setEditForm] = useState({ check_in: '', check_out: '', percentage: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEmployeeData();
    }, [id, selectedMonth]);

    const fetchEmployeeData = async () => {
        setLoading(true);
        try {
            // Fetch employee details
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();
            
            if (empError) throw empError;
            setEmployee(empData);

            // Fetch attendance history
            // Calculate start and end dates of the selected month
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            
            // Get the last day of the month
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${month}-${lastDay}`;

            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', id)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (attError) throw attError;
            
            // Generate full month dates array
            const fullMonthAttendance = [];
            for (let i = 1; i <= lastDay; i++) {
                const currentDateStr = `${year}-${month}-${String(i).padStart(2, '0')}`;
                
                // Find if we have a record for this date
                const existingRecord = (attData || []).find(r => r.date === currentDateStr);
                
                if (existingRecord) {
                    fullMonthAttendance.push(existingRecord);
                } else {
                    // Push a placeholder absent record
                    fullMonthAttendance.push({
                        isAbsent: true,
                        date: currentDateStr,
                        check_in: null,
                        check_out: null,
                        percentage_of_achievement: null,
                        employee_id: id
                    });
                }
            }
            
            // Order descending (newest first)
            fullMonthAttendance.reverse();
            setAttendance(fullMonthAttendance);
        } catch (error) {
            console.error('Error fetching employee details:', error);
            toast.error('حدث خطأ أثناء جلب بيانات الموظف');
            navigate('/admin/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!employee) return;
        
        // Prepare Data for Export
        const profileData = [
            ["معلومات الموظف", ""],
            ["الاسم", employee.name],
            ["المسمى الوظيفي", employee.job_title],
            ["الهوية الوطنية", employee.national_id || '-'],
            ["رقم الجوال", employee.phone || '-'],
            ["المرتب", employee.salary ? `${employee.salary} ريال` : '-'],
            ["المهارات الوظيفية", employee.job_skills || '-'],
            ["", ""], // empty row
            ["سجل الحضور", ""]
        ];

        const headers = ["التاريخ", "وقت الدخول", "وقت الخروج", "عدد الساعات", "نسبة الإنجاز"];
        
        const attendanceRows = attendance.map(rec => {
            return [
                rec.date,
                rec.isAbsent ? '00:00' : formatTime(rec.check_in),
                rec.isAbsent ? '00:00' : formatTime(rec.check_out),
                rec.isAbsent ? '0.0' : calculateHours(rec.check_in, rec.check_out),
                rec.isAbsent ? 'غائب' : (rec.percentage_of_achievement ? `${rec.percentage_of_achievement}%` : '-')
            ];
        });

        const worksheetData = [...profileData, headers, ...attendanceRows];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        // RTL Support
        worksheet['!dir'] = 'rtl';
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الموظف");
        
        XLSX.writeFile(workbook, `تقرير_${employee.name.replace(/\s+/g, '_')}.xlsx`);
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        // Convert timestamp to time string for input type="time"
        const formatForInput = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };

        setEditForm({
            check_in: formatForInput(record.check_in),
            check_out: formatForInput(record.check_out),
            percentage: record.percentage_of_achievement || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dateStr = editingRecord.date;
            
            // Reconstruct ISO timestamps
            const checkInIso = editForm.check_in ? new Date(`${dateStr}T${editForm.check_in}:00`).toISOString() : null;
            const checkOutIso = editForm.check_out ? new Date(`${dateStr}T${editForm.check_out}:00`).toISOString() : null;
            const percentage = editForm.percentage ? parseFloat(editForm.percentage) : null;

            if (editingRecord.id) {
                const { error } = await supabase
                    .from('attendance')
                    .update({
                        check_in: checkInIso,
                        check_out: checkOutIso,
                        percentage_of_achievement: percentage
                    })
                    .eq('id', editingRecord.id);

                if (error) throw error;
            } else {
                // It's an absent day, so insert a new record
                if (!checkInIso || !checkOutIso) {
                    toast.error('يرجى إدخال أوقات الحضور والانصراف لتسجيل يوم جديد');
                    setSaving(false);
                    return;
                }
                const { error } = await supabase
                    .from('attendance')
                    .insert([{
                        employee_id: id,
                        date: dateStr,
                        check_in: checkInIso,
                        check_out: checkOutIso,
                        percentage_of_achievement: percentage
                    }]);

                if (error) throw error;
            }

            toast.success('تم تحديث السجل بنجاح');
            setIsEditModalOpen(false);
            fetchEmployeeData(); // refresh
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('حدث خطأ أثناء التحديث');
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    };

    const calculateHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '0.0';
        const inTime = new Date(checkIn);
        const outTime = new Date(checkOut);
        const diffHours = (outTime - inTime) / (1000 * 60 * 60);
        return diffHours > 0 ? diffHours.toFixed(1) : '0.0';
    };

    // Calculate Average Achievement
    const presentDays = attendance.filter(r => !r.isAbsent && r.percentage_of_achievement != null);
    const averageAchievement = presentDays.length > 0
        ? presentDays.reduce((acc, curr) => acc + curr.percentage_of_achievement, 0) / presentDays.length
        : 0;

    if (loading || !employee) {
        return <div className="text-center py-20 font-bold text-primary">جاري التحميل...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-surface-container hover:bg-zinc-200 rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-zinc-700">arrow_forward</span>
                    </button>
                    <h2 className="text-xl font-bold headline-font text-zinc-900">تفاصيل الموظف</h2>
                </div>
                <div className="flex items-center gap-4">
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-surface-container border-none rounded-xl px-4 py-2.5 font-bold text-zinc-700 focus:ring-2 focus:ring-primary/20"
                    />
                    <button onClick={handleExportExcel} className="bg-primary hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-xl transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-sm">download</span>
                        تصدير
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {employee.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">الاسم</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">المسمى الوظيفي</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.job_title}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">الهوية الوطنية</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.national_id || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">رقم الجوال</p>
                            <p className="font-bold text-zinc-900 text-lg" dir="ltr">{employee.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">المرتب</p>
                            <p className="font-bold text-zinc-900 text-lg">{employee.salary ? `${employee.salary} ريال` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 mb-1">متوسط الإنجاز</p>
                            <p className="font-bold text-green-600 text-lg">{averageAchievement.toFixed(1)}%</p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-sm text-zinc-500 mb-2">المهارات الوظيفية</p>
                            {employee.job_skills ? (
                                <ul className="list-disc list-inside space-y-1 text-zinc-700 font-medium">
                                    {employee.job_skills.split(',').map((skill, idx) => (
                                        <li key={idx}>{skill.trim()}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-zinc-500">-</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-zinc-900">سجل الحضور والغياب</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-surface-container-low text-zinc-600 font-bold">
                            <tr>
                                <th className="px-6 py-4">اليوم/التاريخ</th>
                                <th className="px-6 py-4">وقت الدخول</th>
                                <th className="px-6 py-4">وقت الخروج</th>
                                <th className="px-6 py-4">عدد الساعات</th>
                                <th className="px-6 py-4">نسبة الإنجاز</th>
                                <th className="px-6 py-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {attendance.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-zinc-500">لا يوجد سجلات في هذا الشهر</td></tr>
                            ) : (
                                attendance.map((rec) => (
                                    <tr key={rec.id || rec.date} className={`transition-colors ${rec.isAbsent ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-zinc-50'}`}>
                                        <td className="px-6 py-4 font-bold text-zinc-900">
                                            {rec.date}
                                            {rec.isAbsent && <span className="mr-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md">غائب</span>}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-700">{rec.isAbsent ? '00:00' : formatTime(rec.check_in)}</td>
                                        <td className="px-6 py-4 text-zinc-700">{rec.isAbsent ? '00:00' : formatTime(rec.check_out)}</td>
                                        <td className="px-6 py-4 font-bold text-primary">{rec.isAbsent ? '0.0' : calculateHours(rec.check_in, rec.check_out)} ساعة</td>
                                        <td className="px-6 py-4 font-bold text-green-600">
                                            {rec.isAbsent ? '-' : (rec.percentage_of_achievement ? `${rec.percentage_of_achievement}%` : '-')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => openEditModal(rec)}
                                                className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors inline-flex"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-surface-container-lowest">
                            <h3 className="font-bold text-lg headline-font text-zinc-900">تعديل سجل الحضور</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">وقت الدخول</label>
                                <input 
                                    type="time" 
                                    value={editForm.check_in}
                                    onChange={(e) => setEditForm({...editForm, check_in: e.target.value})}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">وقت الخروج</label>
                                <input 
                                    type="time" 
                                    value={editForm.check_out}
                                    onChange={(e) => setEditForm({...editForm, check_out: e.target.value})}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">نسبة الإنجاز (%)</label>
                                <input 
                                    type="number" 
                                    min="0" max="100" step="0.1"
                                    value={editForm.percentage}
                                    onChange={(e) => setEditForm({...editForm, percentage: e.target.value})}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="مثال: 85.5"
                                />
                            </div>
                            
                            <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                                <p className="text-sm text-primary font-bold flex justify-between">
                                    <span>عدد الساعات المحسوب:</span>
                                    <span>{calculateHours(`2000-01-01T${editForm.check_in || '00:00'}:00`, `2000-01-01T${editForm.check_out || '00:00'}:00`)} ساعة</span>
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 font-bold text-zinc-600 bg-surface-container hover:bg-zinc-200 rounded-xl transition-colors">
                                    إلغاء
                                </button>
                                <button disabled={saving} type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDetail;
