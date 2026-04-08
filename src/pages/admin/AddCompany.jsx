import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AddCompany = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || formData.name.trim().length < 3) {
            toast.error("اسم الشركة يجب أن يكون 3 أحرف على الأقل");
            return;
        }

        setLoading(true);

        try {
            console.log('🏢 Creating new company...');
            
            const { data, error } = await supabase
                .from('companies')
                .insert([{ name: formData.name.trim() }])
                .select();

            if (error) {
                console.error('❌ Company insert error:', error);
                throw new Error(`فشل إضافة الشركة: ${error.message}`);
            }

            console.log('✅ Company created successfully:', data[0]);
            
            toast.success(`تم إضافة الشركة بنجاح!\n\nاسم الشركة: ${formData.name}`);
            navigate('/admin/company-selection');
            
        } catch (error) {
            console.error('❌ Error adding company:', error);
            toast.error(error.message || "حدث خطأ أثناء إضافة الشركة");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">add_business</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold headline-font text-zinc-900">إضافة شركة جديدة</h2>
                        <p className="text-sm text-zinc-500">أدخل بيانات الشركة أو الفرع الجديد</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-blue-900 mb-1">معلومات الشركة</h3>
                                <p className="text-xs text-blue-700">سيتم إضافة الشركة إلى قائمة الشركات المتاحة للإدارة. يمكنك إضافة موظفين لهذه الشركة بعد إنشائها.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">corporate_fare</span>
                                اسم الشركة أو الفرع
                            </label>
                            <input 
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text"
                                minLength={3}
                                className="w-full bg-surface-container border-2 border-primary/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-primary" 
                                placeholder="مثال: معهد التدريب - الفرع الرئيسي" 
                            />
                            <p className="text-xs text-zinc-500">3 أحرف على الأقل، اسم واضح ومميز</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-amber-600 mt-0.5">lightbulb</span>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-amber-900 mb-2">أمثلة على أسماء الشركات:</h4>
                                    <ul className="text-xs text-amber-700 space-y-1">
                                        <li>• معهد التدريب - الفرع الرئيسي</li>
                                        <li>• معهد التدريب - الفرع الشرقي</li>
                                        <li>• معهد التدريب - الفرع الغربي</li>
                                        <li>• شركة التطوير التقني</li>
                                        <li>• مركز الخدمات الإدارية</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 flex justify-end gap-4">
                        <button 
                            type="button" 
                            onClick={() => navigate('/admin/company-selection')} 
                            className="px-6 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
                        >
                            إلغاء
                        </button>
                        <button 
                            disabled={loading} 
                            type="submit" 
                            className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ الشركة'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Additional Info Card */}
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 rounded-2xl border border-zinc-200">
                <h3 className="text-base font-bold text-zinc-800 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">help</span>
                    ماذا بعد إضافة الشركة؟
                </h3>
                <div className="space-y-2 text-sm text-zinc-600">
                    <p className="flex items-start gap-2">
                        <span className="text-primary font-bold">1.</span>
                        <span>ستظهر الشركة في قائمة الشركات المتاحة</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-primary font-bold">2.</span>
                        <span>يمكنك اختيار الشركة من صفحة اختيار الشركة</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-primary font-bold">3.</span>
                        <span>بعد اختيار الشركة، يمكنك إضافة موظفين لها</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-primary font-bold">4.</span>
                        <span>يمكنك إدارة حضور وانصراف موظفي هذه الشركة</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AddCompany;
