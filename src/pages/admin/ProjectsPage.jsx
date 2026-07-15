import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import toast from 'react-hot-toast';

const ProjectsPage = () => {
    const { selectedCompanyId } = useCompany();
    const [projects, setProjects] = useState([]);
    const [recurringTasks, setRecurringTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const [projectForm, setProjectForm] = useState({ name: '', description: '' });
    const [taskForm, setTaskForm] = useState({
        project_id: '',
        employee_id: '',
        name: '',
        description: '',
        duration_hours: '',
        cron_expression: '0 8 * * *' // Default: Every day at 8 AM
    });

    const fetchData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            // Fetch Projects
            const { data: pData, error: pError } = await supabase
                .from('projects')
                .select('*')
                .eq('company_id', selectedCompanyId)
                .order('created_at', { ascending: false });
            if (pError) throw pError;
            setProjects(pData || []);

            // Fetch Employees
            const { data: eData, error: eError } = await supabase
                .from('employees')
                .select('id, name')
                .eq('company_id', selectedCompanyId);
            if (eError) throw eError;
            setEmployees(eData || []);

            // Fetch Recurring Tasks (we join with projects implicitly by fetching all for company)
            if (pData && pData.length > 0) {
                const projectIds = pData.map(p => p.id);
                const { data: tData, error: tError } = await supabase
                    .from('recurring_tasks')
                    .select('*, projects(name), employees(name)')
                    .in('project_id', projectIds)
                    .order('created_at', { ascending: false });
                if (tError) throw tError;
                setRecurringTasks(tData || []);
            } else {
                setRecurringTasks([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectForm.name) return toast.error('يرجى إدخال اسم المشروع');
        try {
            const { error } = await supabase.from('projects').insert([{
                ...projectForm,
                company_id: selectedCompanyId
            }]);
            if (error) throw error;
            toast.success('تم إضافة المشروع بنجاح');
            setIsProjectModalOpen(false);
            setProjectForm({ name: '', description: '' });
            fetchData();
        } catch (error) {
            toast.error('خطأ في إضافة المشروع');
        }
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        if (!taskForm.name || !taskForm.project_id || !taskForm.employee_id || !taskForm.duration_hours) {
            return toast.error('يرجى تعبئة جميع الحقول المطلوبة');
        }
        try {
            const { error } = await supabase.from('recurring_tasks').insert([{
                ...taskForm
            }]);
            if (error) throw error;
            toast.success('تم إضافة المهمة الدورية بنجاح');
            setIsTaskModalOpen(false);
            setTaskForm({ ...taskForm, name: '', description: '', duration_hours: '' });
            fetchData();
        } catch (error) {
            toast.error('خطأ في إضافة المهمة');
        }
    };

    if (!selectedCompanyId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
                <span className="material-symbols-outlined text-6xl mb-4 text-zinc-300">domain_disabled</span>
                <h2 className="text-xl font-bold headline-font">لم يتم اختيار شركة</h2>
                <p>يرجى اختيار شركة من القائمة أولاً لإدارة مشاريعها.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold headline-font text-zinc-900">المشاريع والمهام الدورية</h1>
                    <p className="text-sm text-zinc-500">إدارة المشاريع وإعداد قوالب المهام الدورية للموظفين</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsProjectModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        إضافة مشروع
                    </button>
                    <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex items-center gap-2 bg-surface-container text-primary border border-primary/20 px-4 py-2 rounded-xl font-medium hover:bg-primary/5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">event_repeat</span>
                        إضافة مهمة دورية
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Projects Column */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="font-bold text-zinc-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">folder_managed</span>
                            المشاريع الحالية ({projects.length})
                        </h2>
                        <div className="space-y-3">
                            {projects.length === 0 ? (
                                <p className="text-sm text-zinc-500 bg-white p-4 rounded-xl border border-zinc-100 text-center">لا توجد مشاريع مضافة</p>
                            ) : (
                                projects.map(project => (
                                    <div key={project.id} className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm hover:border-primary/30 transition-colors">
                                        <h3 className="font-bold text-zinc-900">{project.name}</h3>
                                        {project.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{project.description}</p>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recurring Tasks Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="font-bold text-zinc-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">event_repeat</span>
                            المهام الدورية ({recurringTasks.length})
                        </h2>
                        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-600 font-bold">
                                        <tr>
                                            <th className="px-4 py-3">المهمة</th>
                                            <th className="px-4 py-3">المشروع</th>
                                            <th className="px-4 py-3">الموظف المسؤول</th>
                                            <th className="px-4 py-3">المدة المقدرة</th>
                                            <th className="px-4 py-3">التكرار (Cron)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {recurringTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-zinc-500">لا توجد مهام دورية</td>
                                            </tr>
                                        ) : (
                                            recurringTasks.map(task => (
                                                <tr key={task.id} className="hover:bg-zinc-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-zinc-900">{task.name}</p>
                                                        {task.description && <p className="text-xs text-zinc-500 truncate max-w-xs">{task.description}</p>}
                                                    </td>
                                                    <td className="px-4 py-3 text-zinc-600">{task.projects?.name}</td>
                                                    <td className="px-4 py-3 text-zinc-600">
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                                            {task.employees?.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-zinc-600">{task.duration_hours} ساعة</td>
                                                    <td className="px-4 py-3">
                                                        <code className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-600 font-mono" dir="ltr">
                                                            {task.cron_expression}
                                                        </code>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Modal */}
            {isProjectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg headline-font">إضافة مشروع جديد</h3>
                            <button onClick={() => setIsProjectModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-1">اسم المشروع *</label>
                                <input 
                                    required
                                    type="text" 
                                    value={projectForm.name}
                                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                                    className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="مثال: مشروع تطوير النظام المالي"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 mb-1">الوصف</label>
                                <textarea 
                                    rows="3"
                                    value={projectForm.description}
                                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                                    className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                    placeholder="وصف مختصر للمشروع (اختياري)"
                                ></textarea>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors">حفظ المشروع</button>
                                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-6 py-2.5 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-lg headline-font text-amber-600 flex items-center gap-2">
                                <span className="material-symbols-outlined">event_repeat</span>
                                إضافة مهمة دورية
                            </h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <form id="task-form" onSubmit={handleTaskSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-700 mb-1">المشروع التابع له *</label>
                                        <select 
                                            required
                                            value={taskForm.project_id}
                                            onChange={(e) => setTaskForm({...taskForm, project_id: e.target.value})}
                                            className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        >
                                            <option value="">اختر المشروع...</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-700 mb-1">الموظف المسؤول *</label>
                                        <select 
                                            required
                                            value={taskForm.employee_id}
                                            onChange={(e) => setTaskForm({...taskForm, employee_id: e.target.value})}
                                            className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        >
                                            <option value="">اختر الموظف...</option>
                                            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-1">اسم المهمة *</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={taskForm.name}
                                        onChange={(e) => setTaskForm({...taskForm, name: e.target.value})}
                                        className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="مثال: مراجعة القيود اليومية"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-1">الوصف</label>
                                    <textarea 
                                        rows="2"
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                                        className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                        placeholder="تفاصيل وإرشادات أداء المهمة"
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-700 mb-1">المدة المقدرة (بالساعات) *</label>
                                        <input 
                                            required
                                            type="number" 
                                            min="0.5"
                                            step="0.5"
                                            value={taskForm.duration_hours}
                                            onChange={(e) => setTaskForm({...taskForm, duration_hours: e.target.value})}
                                            className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="مثال: 2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-700 mb-1" dir="ltr">Cron Expression *</label>
                                        <input 
                                            required
                                            type="text" 
                                            dir="ltr"
                                            value={taskForm.cron_expression}
                                            onChange={(e) => setTaskForm({...taskForm, cron_expression: e.target.value})}
                                            className="w-full font-mono bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">الافتراضي: 0 8 * * * (يومياً 8 صباحاً)</p>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 shrink-0 bg-zinc-50">
                            <button type="submit" form="task-form" className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm text-sm">حفظ المهمة الدورية</button>
                            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition-colors text-sm">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;
