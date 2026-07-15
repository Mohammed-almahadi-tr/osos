import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TasksPage = () => {
    const { selectedCompanyId } = useCompany();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        project_id: '',
        employee_id: '',
        name: '',
        description: '',
        duration_hours: '',
        status: 'pending'
    });

    const fetchData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            // Fetch Projects
            const { data: pData, error: pError } = await supabase
                .from('projects')
                .select('id, name')
                .eq('company_id', selectedCompanyId);
            if (pError) throw pError;
            setProjects(pData || []);

            // Fetch Employees
            const { data: eData, error: eError } = await supabase
                .from('employees')
                .select('id, name')
                .eq('company_id', selectedCompanyId);
            if (eError) throw eError;
            setEmployees(eData || []);

            // Fetch Tasks for the projects today
            if (pData && pData.length > 0) {
                const projectIds = pData.map(p => p.id);
                
                // Get start and end of today
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const { data: tData, error: tError } = await supabase
                    .from('tasks')
                    .select('*, projects(name), employees(name)')
                    .in('project_id', projectIds)
                    .gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString())
                    .order('created_at', { ascending: false });
                if (tError) throw tError;
                setTasks(tData || []);
            } else {
                setTasks([]);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('فشل في تحميل بيانات المهام');
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        if (!taskForm.name || !taskForm.project_id || !taskForm.employee_id || !taskForm.duration_hours) {
            return toast.error('يرجى تعبئة جميع الحقول المطلوبة');
        }
        try {
            const { error } = await supabase.from('tasks').insert([{
                ...taskForm
            }]);
            if (error) throw error;
            toast.success('تم تعيين المهمة بنجاح');
            setIsTaskModalOpen(false);
            setTaskForm({ project_id: '', employee_id: '', name: '', description: '', duration_hours: '', status: 'pending' });
            fetchData();
        } catch (error) {
            toast.error('خطأ في إضافة المهمة');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">مكتملة</span>;
            case 'in_progress': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">قيد التنفيذ</span>;
            default: return <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md text-xs font-bold">قيد الانتظار</span>;
        }
    };

    if (!selectedCompanyId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
                <span className="material-symbols-outlined text-6xl mb-4 text-zinc-300">domain_disabled</span>
                <h2 className="text-xl font-bold headline-font">لم يتم اختيار شركة</h2>
                <p>يرجى اختيار شركة من القائمة أولاً.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold headline-font text-zinc-900">مهام اليوم</h1>
                    <p className="text-sm text-zinc-500">تتبع وإدارة مهام الموظفين المجدولة لليوم الحالي</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="flex items-center gap-2 bg-white text-zinc-600 border border-zinc-200 px-4 py-2 rounded-xl font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        تحديث
                    </button>
                    <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">add_task</span>
                        مهمة جديدة
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Gantt / Timetable Overview (Simplified for now) */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 overflow-hidden">
                        <h2 className="font-bold text-lg headline-font text-zinc-800 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">view_timeline</span>
                            الجدول الزمني للفرق
                        </h2>
                        <div className="overflow-x-auto custom-scrollbar pb-4">
                            <div className="min-w-[800px]">
                                {/* Timeline Header (8am to 7pm) */}
                                <div className="flex border-b border-zinc-100 pb-2 mb-4 ml-[120px]">
                                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => (
                                        <div key={hour} className="flex-1 text-center text-xs font-bold text-zinc-400">
                                            {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'م' : 'ص'}
                                        </div>
                                    ))}
                                </div>

                                {/* Employees Timelines */}
                                <div className="space-y-4">
                                    {employees.map(employee => {
                                        const employeeTasks = tasks.filter(t => t.employee_id === employee.id);
                                        if (employeeTasks.length === 0) return null; // Only show employees with tasks today
                                        
                                        return (
                                            <div key={employee.id} className="flex items-center gap-4">
                                                <div className="w-[104px] shrink-0 text-sm font-bold text-zinc-700 truncate" title={employee.name}>
                                                    {employee.name}
                                                </div>
                                                <div className="flex-1 h-10 bg-zinc-50 rounded-lg relative border border-zinc-100">
                                                    {employeeTasks.map((task, index) => {
                                                        // Simple naive rendering - in a real app this would calculate exact start/end positions based on time
                                                        // Here we just stack them horizontally with fixed widths based on duration for demo
                                                        const widthPercent = (task.duration_hours / 11) * 100; // 11 hours total
                                                        const leftPercent = index * widthPercent; // naive stacking
                                                        
                                                        return (
                                                            <div 
                                                                key={task.id}
                                                                className={clsx(
                                                                    "absolute top-1 bottom-1 rounded-md border flex items-center px-2 shadow-sm overflow-hidden text-xs truncate transition-all hover:z-10 hover:scale-[1.02] cursor-pointer",
                                                                    task.status === 'completed' ? 'bg-green-100 border-green-200 text-green-800' :
                                                                    task.status === 'in_progress' ? 'bg-amber-100 border-amber-200 text-amber-800' :
                                                                    'bg-primary/10 border-primary/20 text-primary-dark'
                                                                )}
                                                                style={{
                                                                    width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
                                                                    right: `${leftPercent}%` // Right for RTL
                                                                }}
                                                                title={`${task.name} (${task.duration_hours} ساعة)`}
                                                            >
                                                                <span className="font-bold truncate">{task.name}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {tasks.length === 0 && (
                                        <div className="text-center text-zinc-400 py-8 text-sm">
                                            لا توجد مهام موزعة لهذا اليوم
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Tasks List */}
                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                            <h2 className="font-bold text-lg headline-font text-zinc-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">list_alt</span>
                                قائمة المهام التفصيلية
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-600 font-bold">
                                    <tr>
                                        <th className="px-6 py-4">المهمة</th>
                                        <th className="px-6 py-4">المشروع</th>
                                        <th className="px-6 py-4">الموظف</th>
                                        <th className="px-6 py-4">الحالة</th>
                                        <th className="px-6 py-4">ملاحظات الإنجاز</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {tasks.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">لا توجد مهام اليوم</td>
                                        </tr>
                                    ) : (
                                        tasks.map(task => (
                                            <tr key={task.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-zinc-900">{task.name}</p>
                                                    {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{task.description}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600">{task.projects?.name}</td>
                                                <td className="px-6 py-4 text-zinc-600">{task.employees?.name}</td>
                                                <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                                                <td className="px-6 py-4">
                                                    {task.employee_notes ? (
                                                        <p className="text-xs text-zinc-600 bg-zinc-100 p-2 rounded-lg">{task.employee_notes}</p>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-lg headline-font text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">add_task</span>
                                تعيين مهمة جديدة لليوم
                            </h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <form id="new-task-form" onSubmit={handleTaskSubmit} className="space-y-4">
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
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 mb-1">الوصف والتعليمات</label>
                                    <textarea 
                                        rows="2"
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                                        className="w-full bg-surface-container border border-zinc-200 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                    ></textarea>
                                </div>
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
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 shrink-0 bg-zinc-50">
                            <button type="submit" form="new-task-form" className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm text-sm">حفظ المهمة وتعيينها</button>
                            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition-colors text-sm">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksPage;
