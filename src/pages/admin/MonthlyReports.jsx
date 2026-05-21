import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const MonthlyReports = () => {
    const { selectedCompanyId } = useCompany();
    const navigate = useNavigate();
    // Default to current year and month (e.g., "2024-03")
    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfExporting, setPdfExporting] = useState(false);
    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        if (selectedCompanyId) {
            fetchReport();
        }
    }, [selectedCompanyId, month]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Get all employees for the company
            const { data: employeesData, error: empError } = await supabase
                .from('employees')
                .select('id, name, job_title, national_id, salary')
                .eq('company_id', selectedCompanyId);

            if (empError) throw empError;

            const empIds = employeesData.map(e => e.id);

            // Fetch company name
            const { data: compData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', selectedCompanyId)
                .single();
            if (compData) setCompanyName(compData.name);

            // Fetch attendance for the selected month
            // format: YYYY-MM
            const [year, mnth] = month.split('-');
            const startDate = `${year}-${mnth}-01`;
            // Calculate end date of the month
            const nextMonth = Number(mnth) === 12 ? 1 : Number(mnth) + 1;
            const nextYear = Number(mnth) === 12 ? Number(year) + 1 : Number(year);
            const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            const { data: attendanceData, error: attError } = await supabase
                .from('attendance')
                .select('employee_id, date, check_in, check_out, percentage_of_achievement')
                .in('employee_id', empIds)
                .gte('date', startDate)
                .lt('date', endDate);

            if (attError) throw attError;

            // Compute statistics
            const totalWorkDays = getWorkDaysInMonth(Number(year), Number(mnth) - 1);
            const lastDay = new Date(Number(year), Number(mnth), 0).getDate();

            const report = employeesData.map(emp => {
                const empAtt = attendanceData.filter(a => a.employee_id === emp.id);
                
                let daysPresent = 0;
                let daysAbsent = 0;
                let totalHoursNum = 0;
                let totalAchievement = 0;
                let presentDaysCountForAvg = 0;

                for (let i = 1; i <= lastDay; i++) {
                    const dateObj = new Date(Number(year), Number(mnth) - 1, i);
                    const dayOfWeek = dateObj.getDay();
                    // 0 = Sunday, 1 = Monday ... 5 = Friday, 6 = Saturday
                    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

                    const dateStr = `${year}-${mnth}-${String(i).padStart(2, '0')}`;
                    const existing = empAtt.find(r => r.date === dateStr);
                    
                    const rec = existing || {
                        isAbsent: false,
                        date: dateStr,
                        check_in: `${dateStr}T08:00:00`,
                        check_out: `${dateStr}T12:00:00`,
                        percentage_of_achievement: 90
                    };

                    if (rec.percentage_of_achievement != null) {
                        totalAchievement += rec.percentage_of_achievement;
                        presentDaysCountForAvg++;
                    }

                    if (rec.check_in) {
                        daysPresent++;
                        if (rec.check_out) {
                            const inT = new Date(rec.check_in);
                            const outT = new Date(rec.check_out);
                            const diffHours = (outT - inT) / (1000 * 60 * 60);
                            if (diffHours > 0) {
                                totalHoursNum += diffHours;
                            }
                        }
                    } else {
                        daysAbsent++;
                    }
                }

                const rate = presentDaysCountForAvg > 0 ? (totalAchievement / presentDaysCountForAvg) : 0;

                return {
                    ...emp,
                    daysPresent,
                    daysAbsent,
                    totalHours: totalHoursNum.toFixed(1),
                    completionRate: rate.toFixed(1)
                };
            });

            setReportData(report);
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("حدث خطأ أثناء تحميل التقرير الشهري");
        } finally {
            setLoading(false);
        }
    };

    // Helper: calculate working days in a month (excluding Friday/Saturday assume standard ME weekend)
    function getWorkDaysInMonth(year, monthIndex) {
        let days = 0;
        const date = new Date(year, monthIndex, 1);
        while (date.getMonth() === monthIndex) {
            const day = date.getDay();
            // 5 = Friday, 6 = Saturday
            if (day !== 5 && day !== 6) {
                days++;
            }
            date.setDate(date.getDate() + 1);
        }
        return days;
    }

    const handleExportExcel = () => {
        if (reportData.length === 0) {
            toast.error("لا توجد بيانات للتصدير");
            return;
        }

        setTimeout(() => {
            try {
                const headers = ["الموظف", "القسم/دور", "أيام الحضور", "أيام الغياب", "إجمالي الساعات", "نسبة الالتزام"];

                const rowsData = reportData.map(row => [
                    row.name,
                    row.job_title || '',
                    `${row.daysPresent} يوم`,
                    `${row.daysAbsent} يوم`,
                    `${row.totalHours} ساعة`,
                    `${row.completionRate}%`
                ]);

                const worksheetData = [headers, ...rowsData];
                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                worksheet['!dir'] = 'rtl';

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير الشهري");

                const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `تقرير_شهري_${month}.xlsx`;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
            } catch (error) {
                console.error("Export Error: ", error);
                toast.error("حدث خطأ أثناء تصدير Excel");
            }
        }, 50);
    };

    const exportAggregatePDF = () => {
        if (reportData.length === 0) {
            toast.error("لا توجد بيانات للتصدير");
            return;
        }
        setPdfExporting(true);

        setTimeout(async () => {
            try {
                const cName = companyName || "غير محدد";

                const pdfBytes = await fetch('/osos_paper.pdf').then(res => res.arrayBuffer());
                const fontBytes = await fetch('/fonts/Cairo-VariableFont_slnt,wght.ttf').then(res => res.arrayBuffer());

                const pdfDoc = await PDFDocument.load(pdfBytes);
                pdfDoc.registerFontkit(fontkit);
                const customFont = await pdfDoc.embedFont(fontBytes);

            const drawRTL = (page, text, x, y, size = 12) => {
                if (!text) return;
                const str = String(text);
                const regex = /([A-Za-z0-9.:%/-]+(?:\s+[A-Za-z0-9.:%/-]+)*)/g;
                const segments = str.split(regex).filter(Boolean);
                let totalWidth = 0;
                const segWidths = segments.map(seg => {
                    const w = customFont.widthOfTextAtSize(seg, size);
                    totalWidth += w;
                    return w;
                });
                let currentX = x;
                segments.forEach((seg, index) => {
                    const w = segWidths[index];
                    page.drawText(seg, { x: currentX - w, y, size, font: customFont });
                    currentX -= w;
                });
            };

            const drawCenteredText = (page, text, rightBound, width, y, size) => {
                const fullText = String(text || '');
                if (!fullText) return;
                const textWidth = customFont.widthOfTextAtSize(fullText, size);

                const drawLine = (lineText, lineY) => {
                    const regex = /([A-Za-z0-9.:%/-]+(?:\s+[A-Za-z0-9.:%/-]+)*)/g;
                    const segments = lineText.split(regex).filter(Boolean);
                    let totalW = 0;
                    const segWidths = segments.map(seg => {
                        const w = customFont.widthOfTextAtSize(seg, size);
                        totalW += w;
                        return w;
                    });
                    let currentX = rightBound - (width / 2) + (totalW / 2);
                    segments.forEach((seg, index) => {
                        const w = segWidths[index];
                        page.drawText(seg, { x: currentX - w, y: lineY, size, font: customFont });
                        currentX -= w;
                    });
                };

                if (textWidth > width - 10) {
                    const words = fullText.split(' ');
                    const half = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, half).join(' ');
                    const line2 = words.slice(half).join(' ');
                    drawLine(line1, y + 6);
                    drawLine(line2, y - 6);
                } else {
                    drawLine(fullText, y);
                }
            };

            const colWidths = [30, 110, 70, 70, 40, 40, 40, 50, 50];
            const headers = ["م", "الاسم", "الهوية", "المهنة", "الحالة", "حضور", "غياب", "اجمالي الساعات", "الراتب"];
            const boxX = 47.5;
            const rowHeight = 35;

            const getColRightBound = (index) => {
                let r = boxX + 500;
                for (let j = 0; j < index; j++) {
                    r -= colWidths[j];
                }
                return r;
            };

            let page = pdfDoc.getPages()[0];
            const [yearStr, mnthStr] = month.split('-');

            // Only draw document info on first page
            drawCenteredText(page, "سجل الحضور والانصراف الشهري", 595, 595, 720, 18);

            let docInfoY = 680;
            const labelX = 550;
            const valueX = 490;

            drawRTL(page, 'الشركة :', labelX, docInfoY, 14);
            drawRTL(page, cName, valueX, docInfoY, 14);

            docInfoY -= 25;
            drawRTL(page, 'الشهر :', labelX, docInfoY, 14);
            drawRTL(page, mnthStr, valueX, docInfoY, 14);

            docInfoY -= 25;
            drawRTL(page, 'العام :', labelX, docInfoY, 14);
            drawRTL(page, yearStr, valueX, docInfoY, 14);

            const drawTableHeaders = (p, startY) => {
                p.drawRectangle({
                    x: boxX,
                    y: startY,
                    width: 500,
                    height: rowHeight,
                    color: rgb(0.98, 0.78, 0.36),
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 1,
                });

                headers.forEach((text, i) => {
                    const rBound = getColRightBound(i);
                    drawCenteredText(p, text, rBound, colWidths[i], startY + 12, 10);
                    if (i > 0) {
                        p.drawLine({
                            start: { x: rBound, y: startY },
                            end: { x: rBound, y: startY + rowHeight },
                            thickness: 1,
                            color: rgb(0, 0, 0)
                        });
                    }
                });
            };

            let currentY = 560;
            drawTableHeaders(page, currentY);
            currentY -= rowHeight;

            for (let idx = 0; idx < reportData.length; idx++) {
                if (currentY < 50) {
                    page = pdfDoc.addPage([595, 842]);
                    currentY = 780;
                    drawTableHeaders(page, currentY);
                    currentY -= rowHeight;
                }

                const row = reportData[idx];

                const rowData = [
                    String(idx + 1),
                    row.name || "-",
                    row.national_id || "-",
                    row.job_title || "-",
                    "نشط",
                    String(row.daysPresent),
                    String(row.daysAbsent),
                    String(row.totalHours),
                    row.salary ? String(row.salary) : "-"
                ];

                page.drawRectangle({
                    x: boxX,
                    y: currentY,
                    width: 500,
                    height: rowHeight,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 1,
                });

                rowData.forEach((text, i) => {
                    const rBound = getColRightBound(i);
                    drawCenteredText(page, text, rBound, colWidths[i], currentY + 12, 10);
                    if (i > 0) {
                        page.drawLine({
                            start: { x: rBound, y: currentY },
                            end: { x: rBound, y: currentY + rowHeight },
                            thickness: 1,
                            color: rgb(0, 0, 0)
                        });
                    }
                });

                currentY -= rowHeight;
            }

            const pdfOutput = await pdfDoc.save();
            const blob = new Blob([pdfOutput], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `التقرير_الشهري_${month}.pdf`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);

            toast.success("تم تصدير PDF بنجاح");
        } catch (error) {
            console.error("Export Error: ", error);
            toast.error("حدث خطأ أثناء تصدير PDF");
        } finally {
            setPdfExporting(false);
        }
        }, 50);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold headline-font text-zinc-900">التقارير الشهرية</h2>
                    <p className="text-sm text-zinc-500">إحصائيات شاملة لحضور وانصراف الموظفين</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-48"
                        />
                    </div>
                    <button onClick={handleExportExcel} className="bg-primary hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-xl transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
                        <span className="material-symbols-outlined text-sm">download</span>
                        تصدير Excel
                    </button>
                    <button
                        onClick={exportAggregatePDF}
                        disabled={pdfExporting}
                        className="bg-red-600 hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-xl transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        <span className="material-symbols-outlined text-sm">{pdfExporting ? 'hourglass_empty' : 'picture_as_pdf'}</span>
                        {pdfExporting ? 'جاري التصدير...' : 'تصدير PDF'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-zinc-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-surface-container-low text-zinc-600 font-bold">
                            <tr>
                                <th className="px-6 py-4 rounded-tr-xl">الموظف</th>
                                <th className="px-6 py-4">الهوية الوطنية</th>
                                <th className="px-6 py-4">المرتب</th>
                                <th className="px-6 py-4">أيام الحضور</th>
                                <th className="px-6 py-4">أيام الغياب</th>
                                <th className="px-6 py-4">إجمالي الساعات</th>
                                <th className="px-6 py-4 rounded-tl-xl">نسبة الالتزام</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-10 font-bold text-primary">جاري إعداد التقرير...</td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-zinc-500">لا يوجد موظفين مسجلين</td></tr>
                            ) : (
                                reportData.map((row) => (
                                    <tr key={row.id} onClick={() => navigate(`/admin/employee/${row.id}`)} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {row.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">{row.name}</p>
                                                    <p className="text-xs text-zinc-500">{row.job_title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 font-medium">{row.national_id || '-'}</td>
                                        <td className="px-6 py-4 text-zinc-600 font-medium">{row.salary ? `${row.salary} ريال` : '-'}</td>
                                        <td className="px-6 py-4 font-bold text-green-600">{row.daysPresent} يوم</td>
                                        <td className="px-6 py-4 font-bold text-error">{row.daysAbsent} يوم</td>
                                        <td className="px-6 py-4 font-bold text-zinc-900">{row.totalHours} ساعة</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-zinc-900 w-12">{row.completionRate}%</span>
                                                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${row.completionRate}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReports;
