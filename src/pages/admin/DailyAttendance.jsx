import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const DailyAttendance = () => {
    const { selectedCompanyId } = useCompany();
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRows, setAttendanceRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfExporting, setPdfExporting] = useState(false);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchAttendance();
        }
    }, [selectedCompanyId, date]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            // Fetch employees for company
            const { data: employeesData, error: empError } = await supabase
                .from('employees')
                .select('id, name, job_title, national_id, salary')
                .eq('company_id', selectedCompanyId);

            if (empError) throw empError;

            const empIds = employeesData.map(e => e.id);

            // Fetch attendance for those employees on selected date
            const { data: attendanceData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .in('employee_id', empIds)
                .eq('date', date);

            if (attError) throw attError;

            // Merge Data
            const rows = employeesData.map(emp => {
                const attRec = attendanceData.find(a => a.employee_id === emp.id);
                return {
                    ...emp,
                    attendance_id: attRec?.id,
                    check_in: attRec?.check_in,
                    check_out: attRec?.check_out,
                };
            });

            setAttendanceRows(rows);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error("حدث خطأ أثناء جلب سجلات الحضور");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    };

    const handleExportExcel = () => {
        if (attendanceRows.length === 0) {
            toast.error("لا توجد بيانات للتصدير");
            return;
        }

        const headers = ["الموظف", "القسم/دور", "وقت الدخول", "وقت الخروج", "الحالة"];

        const rowsData = attendanceRows.map(row => {
            const hasCheckedIn = !!row.check_in;
            const hasCheckedOut = !!row.check_out;

            let status = "";
            if (hasCheckedIn && !hasCheckedOut) status = "حاضر الآن";
            else if (hasCheckedOut) status = "منصرف";
            else status = "غائب";

            return [
                row.name,
                row.job_title || '',
                formatTime(row.check_in),
                formatTime(row.check_out),
                status
            ];
        });

        const worksheetData = [headers, ...rowsData];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        worksheet['!dir'] = 'rtl';

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الحضور");

        const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `تقرير_الحضور_${date}.xlsx`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
    };

    const exportAggregatePDF = async () => {
        if (attendanceRows.length === 0) {
            toast.error("لا توجد بيانات للتصدير");
            return;
        }
        setPdfExporting(true);
        try {
            const { data: companyData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', selectedCompanyId)
                .single();

            const companyName = companyData?.name || "غير محدد";

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
            const yearStr = date.split('-')[0];

            // Only draw document info on first page
            drawCenteredText(page, "سجل الحضور والانصراف اليومي", 595, 595, 720, 18);

            let docInfoY = 680;
            const labelX = 550;
            const valueX = 490;

            drawRTL(page, 'الشركة :', labelX, docInfoY, 14);
            drawRTL(page, companyName, valueX, docInfoY, 14);

            docInfoY -= 25;
            drawRTL(page, 'التاريخ :', labelX, docInfoY, 14);
            drawRTL(page, date, valueX, docInfoY, 14);

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

            for (let idx = 0; idx < attendanceRows.length; idx++) {
                if (currentY < 50) {
                    page = pdfDoc.addPage([595, 842]);
                    currentY = 780;
                    drawTableHeaders(page, currentY);
                    currentY -= rowHeight;
                }

                const row = attendanceRows[idx];
                const hasCheckedIn = !!row.check_in;
                const hasCheckedOut = !!row.check_out;

                let status = "";
                let inTime = "00:00";
                let outTime = "00:00";
                let hours = "0.0";

                if (hasCheckedIn && !hasCheckedOut) {
                    status = "حاضر الآن";
                    inTime = formatTime(row.check_in);
                } else if (hasCheckedOut) {
                    status = "منصرف";
                    inTime = formatTime(row.check_in);
                    outTime = formatTime(row.check_out);

                    const inT = new Date(row.check_in);
                    const outT = new Date(row.check_out);
                    hours = ((outT - inT) / (1000 * 60 * 60)).toFixed(1);
                } else {
                    status = "غائب";
                }

                const rowData = [
                    String(idx + 1),
                    row.name || "-",
                    row.national_id || "-",
                    row.job_title || "-",
                    status,
                    inTime,
                    outTime,
                    hours,
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
            a.download = `تقرير_الحضور_${date}.pdf`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);

            toast.success("تم تصدير PDF بنجاح");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("حدث خطأ أثناء تصدير PDF");
        } finally {
            setPdfExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold headline-font text-zinc-900">سجل الحضور اليومي</h2>
                    <p className="text-sm text-zinc-500">متابعة حضور وانصراف الموظفين بالتفصيل</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-auto"
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
                                <th className="px-6 py-4">القسم/دور</th>
                                <th className="px-6 py-4">المرتب</th>
                                <th className="px-6 py-4">وقت الدخول</th>
                                <th className="px-6 py-4">وقت الخروج</th>
                                <th className="px-6 py-4 rounded-tl-xl text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-10 font-bold text-primary">جاري التحميل...</td></tr>
                            ) : attendanceRows.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-zinc-500">لا يوجد موظفين مسجلين بناءً على الفلتر</td></tr>
                            ) : (
                                attendanceRows.map((row) => {
                                    const hasCheckedIn = !!row.check_in;
                                    const hasCheckedOut = !!row.check_out;

                                    return (
                                        <tr key={row.id} onClick={() => navigate(`/admin/employee/${row.id}`)} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {row.name.charAt(0)}
                                                    </div>
                                                    <p className="font-bold text-zinc-900">{row.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 font-medium">{row.national_id || '-'}</td>
                                            <td className="px-6 py-4 text-zinc-600 font-medium">{row.job_title}</td>
                                            <td className="px-6 py-4 text-zinc-600 font-medium">{row.salary ? `${row.salary} ريال` : '-'}</td>
                                            <td className="px-6 py-4 font-bold text-zinc-900">{formatTime(row.check_in)}</td>
                                            <td className="px-6 py-4 font-bold text-zinc-900">{formatTime(row.check_out)}</td>
                                            <td className="px-6 py-4 text-center">
                                                {hasCheckedIn && !hasCheckedOut && (
                                                    <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-xs font-bold rounded-full">حاضر الآن</span>
                                                )}
                                                {hasCheckedOut && (
                                                    <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-xs font-bold rounded-full">منصرف</span>
                                                )}
                                                {!hasCheckedIn && (
                                                    <span className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full">غائب</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyAttendance;
