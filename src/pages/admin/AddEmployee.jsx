import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AddEmployee = () => {
    const { selectedCompanyId } = useCompany();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        national_id: '',
        job_title: '',
        salary: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedCompanyId) {
            toast.error("يرجى اختيار شركة أولاً");
            navigate('/admin/company-selection');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('employees')
                .insert([{ ...formData, company_id: selectedCompanyId }]);

            if (error) throw error;
            
            toast.success("تم إضافة الموظف بنجاح");
            navigate('/admin/employees');
        } catch (error) {
            console.error("Error adding employee:", error);
            toast.error("حدث خطأ أثناء إضافة الموظف");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">person_add</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold headline-font text-zinc-900">إضافة موظف جديد</h2>
                        <p className="text-sm text-zinc-500">أدخل بيانات الموظف الأساسية والمعلومات الوظيفية</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            <label className="text-sm font-bold text-zinc-700">البريد الإلكتروني</label>
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
                            <label className="text-sm font-bold text-zinc-700">الراتب الأساسي</label>
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
                    </div>

                    <div className="pt-6 border-t border-zinc-100 flex justify-end gap-4">
                        <button type="button" onClick={() => navigate('/admin/employees')} className="px-6 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors">
                            إلغاء
                        </button>
                        <button disabled={loading} type="submit" className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                            {loading ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployee;
