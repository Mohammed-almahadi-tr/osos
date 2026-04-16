import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
    assignCourseToCompany, 
    getCoursesByCompany, 
    removeAssignment, 
    getAllCourses 
} from '../../services/companyCourses';
import toast from 'react-hot-toast';

const CompanyCourses = () => {
    const [companies, setCompanies] = useState([]);
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    
    // Status states
    const [loadingCompanies, setLoadingCompanies] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchCompanies();
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchAssignments(selectedCompanyId);
        } else {
            setAssignments([]);
        }
    }, [selectedCompanyId]);

    const fetchCompanies = async () => {
        try {
            setLoadingCompanies(true);
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
            setLoadingCompanies(false);
        }
    };

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            const data = await getAllCourses();
            setCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('حدث خطأ أثناء جلب الدورات');
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchAssignments = async (companyId) => {
        try {
            setLoadingAssignments(true);
            const data = await getCoursesByCompany(companyId);
            setAssignments(data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('حدث خطأ أثناء جلب المهام التعينية للدورات');
        } finally {
            setLoadingAssignments(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedCompanyId || !selectedCourseId) {
            toast.error('الرجاء اختيار الشركة والدورة أولا');
            return;
        }

        try {
            setAssigning(true);
            await assignCourseToCompany(selectedCompanyId, selectedCourseId);
            toast.success('تم تعيين الدورة للشركة بنجاح');
            
            // Refresh list
            fetchAssignments(selectedCompanyId);
            // Reset course selection
            setSelectedCourseId('');
        } catch (error) {
            console.error('Error assigning course:', error);
            if (error.code === '23505') { // Postgres unique violation error code
                toast.error('هذه الدورة معينة بالفعل لهذه الشركة');
            } else {
                toast.error('حدث خطأ أثناء التعيين، يرجى المحاولة مرة أخرى');
            }
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteAssignment = async (id, courseName) => {
        if (!confirm(`هل أنت متأكد من حذف ارتباط الشركة بدورة "${courseName}"؟`)) {
            return;
        }

        try {
            await removeAssignment(id);
            toast.success('تم إلغاء التعيين بنجاح');
            // Refresh list
            if (selectedCompanyId) {
                fetchAssignments(selectedCompanyId);
            }
        } catch (error) {
            console.error('Error removing assignment:', error);
            toast.error('حدث خطأ أثناء حذف التعيين');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-2">دورات الشركات</h2>
                <p className="text-zinc-500">قم بتعيين الدورات التدريبية المتاحة للشركات المختارة وإدارة الارتباطات بينها</p>
            </div>

            {/* Assignment Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-6 items-end">
                    
                    <div className="flex-1 w-full relative">
                        <label className="block text-sm font-bold text-zinc-700 mb-2">اختر الشركة</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">domain</span>
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-50"
                                disabled={loadingCompanies}
                            >
                                <option value="" disabled>-- اختر إحدى الشركات --</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {loadingCompanies && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        <label className="block text-sm font-bold text-zinc-700 mb-2">اختر الدورة</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">school</span>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 bg-surface-container border-none rounded-xl focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-50"
                                disabled={loadingCourses || !selectedCompanyId}
                            >
                                <option value="" disabled>-- اختر إحدى الدورات --</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} {c.duration ? `(${c.duration})` : ''}</option>
                                ))}
                            </select>
                            {loadingCourses && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={assigning || !selectedCompanyId || !selectedCourseId}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed h-12"
                    >
                        {assigning ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">add_circle</span>
                                <span>تعيين الدورة</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Assignments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                {!selectedCompanyId ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-zinc-300 mb-4">info</span>
                        <p className="text-zinc-500">الرجاء اختيار شركة لعرض الدورات المرتبطة بها</p>
                    </div>
                ) : loadingAssignments ? (
                    <div className="p-12 text-center text-zinc-500">
                        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>جاري تحميل الدورات المعينة...</p>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-zinc-300 mb-4">assignment_late</span>
                        <p className="text-zinc-500">لا توجد دورات معينة لهذه الشركة حاليا</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-container-low">
                                <tr>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-zinc-700">اسم الدورة</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-zinc-700">المدة</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold text-zinc-700">تاريخ التعيين</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-zinc-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-surface-container-low/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                    <span className="material-symbols-outlined">menu_book</span>
                                                </div>
                                                <span className="font-medium text-zinc-900">{assignment.course_name || 'دورة غير معروفة'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 text-sm">
                                            {assignment.course_duration || 'غير محدد'}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 text-sm">
                                            {new Date(assignment.assigned_at).toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleDeleteAssignment(assignment.id, assignment.course_name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="إلغاء التعيين"
                                                >
                                                    <span className="material-symbols-outlined">link_off</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Stats */}
            {!loadingAssignments && assignments.length > 0 && (
                <div className="bg-gradient-to-br from-primary/5 to-primary-container/5 p-6 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-600">إجمالي الدورات للشركة المختارة</p>
                            <p className="text-3xl font-bold text-zinc-900">{assignments.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyCourses;
