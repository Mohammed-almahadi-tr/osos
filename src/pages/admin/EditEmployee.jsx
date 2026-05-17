import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const EditEmployee = () => {
    const { id } = useParams();
    const { selectedCompanyId } = useCompany();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        national_id: '',
        job_title: '',
        salary: '',
        job_skills: '',
    });

    useEffect(() => {
        if (!selectedCompanyId) {
            navigate('/admin/company-selection');
            return;
        }
        fetchEmployeeData();
    }, [id, selectedCompanyId, navigate]);

    const fetchEmployeeData = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    national_id: data.national_id || '',
                    job_title: data.job_title || '',
                    salary: data.salary || '',
                    job_skills: data.job_skills || '',
                });
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
            toast.error("حدث خطأ أثناء جلب بيانات الموظف");
            navigate('/admin/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setSaving(true);

        try {
            const employeeData = {
                name: formData.name,
                phone: String(formData.phone),
                email: formData.email,
                national_id: formData.national_id ? String(formData.national_id) : null,
                job_title: formData.job_title,
                salary: parseFloat(formData.salary) || 0,
                job_skills: formData.job_skills || ''
            };

            const { error } = await supabase
                .from('employees')
                .update(employeeData)
                .eq('id', id);

            if (error) throw error;
            
            toast.success("تم تحديث بيانات الموظف بنجاح");
            navigate('/admin/employees');
            
        } catch (error) {
            console.error('Error updating employee:', error);
            toast.error(error.message || "حدث خطأ أثناء تحديث بيانات الموظف");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-10 font-bold text-primary">جاري تحميل بيانات الموظف...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">edit</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold headline-font text-zinc-900">تعديل بيانات الموظف</h2>
                        <p className="text-sm text-zinc-500">تحديث المعلومات الشخصية والوظيفية</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-zinc-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">badge</span>
                            المعلومات الشخصية والوظيفية
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">الاسم الرباعي</label>
                                <input 
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    type="text" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="مثال: أحمد محمد عبدالله" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">الهوية الوطنية / الإقامة</label>
                                <input 
                                    required
                                    name="national_id"
                                    value={formData.national_id}
                                    onChange={handleChange}
                                    type="text" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="10XXXXXXXX" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">البريد الإلكتروني (اختياري)</label>
                                <input 
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="employee@company.com" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">رقم الجوال</label>
                                <input 
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="05XXXXXXXX" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">المسمى الوظيفي</label>
                                <input 
                                    required
                                    name="job_title"
                                    value={formData.job_title}
                                    onChange={handleChange}
                                    type="text" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="مثال: مبرمج واجهات" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-700">المرتب</label>
                                <input 
                                    required
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    type="number" 
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20" 
                                    placeholder="5000" 
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-zinc-700">المهارات الوظيفية</label>
                                <textarea 
                                    name="job_skills"
                                    value={formData.job_skills}
                                    onChange={handleChange}
                                    className="w-full bg-surface-container border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 min-h-[100px]" 
                                    placeholder="مثال: البرمجة، إدارة المشاريع، تصميم الواجهات..." 
                                ></textarea>
                                <p className="text-xs text-zinc-500">يمكنك إدخال مهارات متعددة مفصولة بفاصلة</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 flex justify-end gap-4">
                        <button type="button" onClick={() => navigate('/admin/employees')} className="px-6 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors">
                            إلغاء
                        </button>
                        <button disabled={saving} type="submit" className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                            {saving ? 'جاري الحفظ...' : 'تحديث بيانات الموظف'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployee;
