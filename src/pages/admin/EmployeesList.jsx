import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EmployeesList = () => {
    const { selectedCompanyId } = useCompany();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (selectedCompanyId) {
            fetchEmployees();
        }
    }, [selectedCompanyId]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('company_id', selectedCompanyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("حدث خطأ أثناء جلب قائمة الموظفين");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!employeeToDelete) return;

        try {
            // Delete attendance records first to handle foreign key constraint
            const { error: attendanceError } = await supabase
                .from('attendance')
                .delete()
                .eq('employee_id', employeeToDelete.id);

            if (attendanceError) throw attendanceError;

            // Delete the employee
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', employeeToDelete.id);

            if (error) throw error;
            
            toast.success("تم حذف الموظف بنجاح");
            setEmployeeToDelete(null);
            fetchEmployees();
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast.error("حدث خطأ أثناء الحذف");
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(search.toLowerCase()) || 
        (emp.national_id && emp.national_id.includes(search))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold headline-font text-zinc-900">قائمة الموظفين</h2>
                    <p className="text-sm text-zinc-500">إدارة وعرض جميع الموظفين المسجلين في الشركة</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1 w-full sm:w-auto md:w-64">
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            type="text" 
                            className="w-full bg-surface-container-low border-none rounded-xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20" 
                            placeholder="بحث بالاسم أو الهوية..." 
                        />
                    </div>
                    <button onClick={() => navigate('/admin/add-employee')} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors whitespace-nowrap w-full sm:w-auto">
                        <span className="material-symbols-outlined text-sm">add</span>
                        إضافة موظف
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-zinc-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-surface-container-low text-zinc-600 font-bold">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-xl">اسم الموظف</th>
                                <th className="px-6 py-4">الهوية الوطنية</th>
                                <th className="px-6 py-4">المسمى الوظيفي</th>
                                <th className="px-6 py-4">رقم الجوال</th>
                                <th className="px-6 py-4">الراتب</th>
                                <th className="px-6 py-4 rounded-tl-xl">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10 font-bold text-primary">جاري التنزيل...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-zinc-500">لا توجد بيانات متاحة</td></tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">{emp.name}</p>
                                                    <p className="text-xs text-zinc-500">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-700">{emp.national_id}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-surface-container text-zinc-700 rounded-full text-xs font-bold">{emp.job_title}</span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 font-medium">{emp.phone}</td>
                                        <td className="px-6 py-4 font-bold text-zinc-900">{emp.salary} ر.س</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => navigate('/admin/edit-employee/' + emp.id)} className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button type="button" onClick={() => setEmployeeToDelete(emp)} className="p-2 text-zinc-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {employeeToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEmployeeToDelete(null)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-4 text-red-600">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                            <h3 className="text-xl font-bold">تأكيد الحذف</h3>
                        </div>
                        <p className="text-zinc-600 mb-6 leading-relaxed">
                            هل أنت متأكد من حذف الموظف <span className="font-bold text-zinc-900">[{employeeToDelete.name}]</span>؟ 
                            سيتم حذف جميع سجلات الحضور الخاصة به.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button 
                                type="button"
                                onClick={() => setEmployeeToDelete(null)} 
                                className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button 
                                type="button"
                                onClick={handleDelete} 
                                className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesList;
