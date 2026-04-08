import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
    const { user, profile } = useAuth();
    const [employeeId, setEmployeeId] = useState(null);
    const [attendanceRecord, setAttendanceRecord] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchEmployeeData();
        }
    }, [user]);

    const fetchEmployeeData = async () => {
        try {
            // First find the employee record matching the user_id
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('id')
                .eq('user_id', user.id)
                .single();
            
            if (empError && empError.code !== 'PGRST116') throw empError;
            
            if (empData) {
                setEmployeeId(empData.id);
                await fetchTodayAttendance(empData.id);
            }
        } catch (error) {
            console.error("Error fetching employee ID:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayAttendance = async (empId) => {
        const today = new Date().toISOString().split('T')[0];
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', empId)
                .eq('date', today)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            setAttendanceRecord(data);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const handleCheckIn = async () => {
        if (!employeeId) {
            toast.error("لم يتم العثور على سجل الموظف الخاص بك. يرجى التواصل مع الإدارة.");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        setLoading(true);
        try {
            const { error } = await supabase
                .from('attendance')
                .insert([{ 
                    employee_id: employeeId, 
                    date: today,
                    check_in: now 
                }]);
            
            if (error) throw error;
            toast.success("تم تسجيل الحضور بنجاح");
            await fetchTodayAttendance(employeeId);
        } catch (error) {
            console.error("Check-in error:", error);
            toast.error("حدث خطأ أثناء تسجيل الحضور");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!attendanceRecord || !attendanceRecord.id) return;
        const now = new Date().toISOString();

        setLoading(true);
        try {
            const { error } = await supabase
                .from('attendance')
                .update({ check_out: now })
                .eq('id', attendanceRecord.id);
            
            if (error) throw error;
            toast.success("تم تسجيل الانصراف بنجاح");
            await fetchTodayAttendance(employeeId);
        } catch (error) {
            console.error("Check-out error:", error);
            toast.error("حدث خطأ أثناء تسجيل الانصراف");
        } finally {
            setLoading(false);
        }
    };

    const hasCheckedIn = attendanceRecord && attendanceRecord.check_in;
    const hasCheckedOut = attendanceRecord && attendanceRecord.check_out;

    return (
        <div className="space-y-10">
            {/* Hero Welcome & Attendance Action */}
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 md:gap-8 mb-8 md:mb-10">
                <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold editorial-text tracking-tight text-zinc-900 mb-2">أهلاً بك، {profile?.username}</h1>
                    <p className="text-zinc-500 text-base md:text-lg">نتمنى لك يوماً إنتاجياً في معهد التدريب الوطني.</p>
                </div>

                {/* Attendance Action Bar */}
                <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col sm:flex-row items-center gap-6 md:gap-8 w-full lg:w-auto">
                    <div className="flex items-center gap-4 px-2 sm:px-6 border-b sm:border-b-0 pb-4 sm:pb-0 sm:border-l border-zinc-100 w-full sm:w-auto justify-center sm:justify-start">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasCheckedIn && !hasCheckedOut ? 'bg-tertiary/10 text-tertiary' : hasCheckedOut ? 'bg-zinc-100 text-zinc-400' : 'bg-amber-100 text-amber-600'}`}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {hasCheckedIn && !hasCheckedOut ? 'check_circle' : hasCheckedOut ? 'home' : 'schedule'}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 font-medium mb-1">الحالة الحالية</p>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${hasCheckedIn && !hasCheckedOut ? 'bg-tertiary/10 text-tertiary' : hasCheckedOut ? 'bg-zinc-100 text-zinc-500' : 'bg-amber-100 text-amber-700'}`}>
                                {hasCheckedOut ? 'منصرف' : hasCheckedIn ? 'حاضر الآن' : 'غير مسجل حضور'}
                            </span>
                        </div>
                    </div>

                    {!hasCheckedIn ? (
                        <button 
                            onClick={handleCheckIn} 
                            disabled={loading || !employeeId}
                            className="bg-gradient-to-br w-full sm:w-auto from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined">login</span>
                            <span>تسجيل الحضور</span>
                        </button>
                    ) : !hasCheckedOut ? (
                        <button 
                            onClick={handleCheckOut} 
                            disabled={loading}
                            className="bg-gradient-to-br w-full sm:w-auto from-primary to-primary-container text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined">logout</span>
                            <span>تسجيل الانصراف</span>
                        </button>
                    ) : (
                        <div className="w-full sm:w-auto text-center px-8 py-4 rounded-xl font-bold text-zinc-400 bg-zinc-100 border border-zinc-200">
                            تم إنهاء العمل لليوم
                        </div>
                    )}
                </div>
            </div>

            {/* Dashboard Bento Grid */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Placeholder for tasks */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-zinc-900">المهام اليومية التعاونية (قريباً)</h3>
                        </div>
                        <div className="flex items-center justify-center p-10 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
                            لا توجد مهام مسندة حالياً...
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6 order-first lg:order-last">
                    {/* Profile Quick View */}
                    <div className="bg-gradient-to-br from-tertiary to-tertiary-container rounded-2xl p-1 text-white shadow-lg">
                        <div className="bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-6 md:p-8 h-full">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl font-bold border-2 border-white/20">
                                    {profile?.username?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{profile?.username}</h4>
                                    <p className="text-tertiary-fixed-dim text-xs">موظف معتمد</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-300">سجل اليوم</span>
                                    <span className="font-bold">{hasCheckedIn ? new Date(attendanceRecord.check_in).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
