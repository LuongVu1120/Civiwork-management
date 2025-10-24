"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton } from "@/app/lib/modern-components";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";

type Item = { 
  workerId: string;
  fullName: string; 
  totalDays: number; 
  wageTotalVnd: number; 
  mealTotalVnd: number; 
  allowanceVnd: number; 
  payableVnd: number 
};
type DailyDetail = { 
  date: string; 
  dayFraction: number; 
  meal: string; 
  projectName: string; 
  formattedDate: string; 
};
type WorkerDetail = {
  workerId: string;
  workerName: string;
  role: string;
  totalDays: number;
  dailyDetails: DailyDetail[];
};

export default function PayrollMonthlyPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [workerDetails, setWorkerDetails] = useState<WorkerDetail[]>([]);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);

  async function load() {
    setLoading(true);
    setError(null);
    
    try {
      // Tạo AbortController để có thể cancel request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const res = await authenticatedFetch(`/api/payroll/monthly?year=${year}&month=${month}`, { 
        cache: "no-store",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        console.error('API Error:', data.error);
        setError(data.error);
        setItems([]);
        setTotal(0);
        return;
      }
      
      setItems(data.items || []);
      setTotal(data.totalPayableVnd || 0);
      
      // Load detailed attendance data với timeout riêng
      try {
        const detailController = new AbortController();
        const detailTimeoutId = setTimeout(() => detailController.abort(), 20000); // 20s timeout
        
        const detailRes = await authenticatedFetch(`/api/payroll/monthly/detail?year=${year}&month=${month}`, { 
          cache: "no-store",
          signal: detailController.signal
        });
        
        clearTimeout(detailTimeoutId);
        
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          console.log('Detail data loaded:', detailData);
          setWorkerDetails(detailData.workerDetails || []);
        } else {
          console.error('Failed to load detail data:', detailRes.status);
        }
      } catch (detailError) {
        console.error('Error loading detail data:', detailError);
        // Don't show error for detail data, it's optional
        if (detailError instanceof Error && detailError.name === 'AbortError') {
          console.warn('Detail data request was aborted due to timeout');
        }
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request bị timeout. Vui lòng thử lại.');
      } else {
        setError('Không thể tải dữ liệu bảng công');
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [year, month]);

  async function exportExcel() {
    setExportingExcel(true);
    try {
      console.log('Exporting Excel with data:', { items, workerDetails });
      
      // Kiểm tra dữ liệu trước khi export
      if (!items || items.length === 0) {
        alert('Không có dữ liệu để xuất Excel');
        return;
      }
      
      const ExcelJS = (await import("exceljs")).default || (await import("exceljs"));
      const wb = new ExcelJS.Workbook();
      
      // Summary sheet
      const summaryWs = wb.addWorksheet(`TongKet_${year}_${month}`);
      
      // Tạo danh sách các ngày trong tháng
      const daysInMonth = new Date(year, month, 0).getDate();
      const dateColumns = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        dateColumns.push(formattedDate);
      }
      
      // Tạo headers
      const headers = ["Họ tên", ...dateColumns, "Tổng công", "Lương", "Ăn", "Phụ cấp", "Phải trả"];
      
      // Header styling
      summaryWs.getRow(1).font = { bold: true, size: 12 };
      summaryWs.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      
      // Add headers
      summaryWs.addRow(headers);
      
      // Add data rows
      console.log('Adding data rows:', items);
      items.forEach(it => {
        console.log('Adding row for worker:', it.fullName, 'with data:', it);
        
        // Tạo mảng cho các cột ngày
        const dayColumns = [];
        
        try {
          const workerDetail = workerDetails?.find(wd => wd.workerId === it.workerId);
          
          if (workerDetail && workerDetail.dailyDetails && workerDetail.dailyDetails.length > 0) {
            // Tạo map các ngày làm việc
            const workDaysMap = new Map();
            workerDetail.dailyDetails.forEach(detail => {
              try {
                const date = new Date(detail.date);
                const dayKey = date.getDate();
                workDaysMap.set(dayKey, 'x');
              } catch (dateError) {
                console.warn('Error formatting date:', detail.date, dateError);
              }
            });
            
            // Tạo cột cho từng ngày trong tháng
            for (let day = 1; day <= daysInMonth; day++) {
              dayColumns.push(workDaysMap.has(day) ? 'x' : '');
            }
          } else {
            // Nếu không có chi tiết, để trống các cột ngày
            for (let day = 1; day <= daysInMonth; day++) {
              dayColumns.push('');
            }
          }
        } catch (detailError) {
          console.warn('Error processing worker details for', it.fullName, detailError);
          // Fallback: để trống các cột ngày
          for (let day = 1; day <= daysInMonth; day++) {
            dayColumns.push('');
          }
        }
        
        summaryWs.addRow([
          it.fullName, 
          ...dayColumns,
          it.totalDays, 
          it.wageTotalVnd, 
          it.mealTotalVnd, 
          it.allowanceVnd, 
          it.payableVnd
        ]);
      });
      
      // Add total row
      const totalRowData = ["Tổng"];
      // Thêm các cột trống cho các ngày
      for (let day = 1; day <= daysInMonth; day++) {
        totalRowData.push("");
      }
      // Thêm các cột tổng
      totalRowData.push("", "", "", "", total.toString());
      
      const totalRow = summaryWs.addRow(totalRowData);
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6FFE6' }
      };
      
      // Auto-fit columns
      summaryWs.columns.forEach((column, index) => {
        if (index === 0) {
          // Cột tên
          column.width = 20;
        } else if (index <= daysInMonth) {
          // Các cột ngày
          column.width = 8;
        } else {
          // Các cột số liệu
          column.width = 15;
        }
      });
      
      // Add borders
      summaryWs.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
      
      // Detail sheets for each worker - với error handling
      console.log('Creating detail sheets for workers:', workerDetails?.length || 0);
      if (workerDetails && workerDetails.length > 0) {
        workerDetails.forEach(worker => {
          try {
            console.log('Creating sheet for worker:', worker.workerName, 'with details:', worker.dailyDetails?.length || 0);
            const detailWs = wb.addWorksheet(`${worker.workerName}_${year}_${month}`);
        
        // Header
        detailWs.getRow(1).font = { bold: true, size: 14 };
        detailWs.getCell('A1').value = `CHI TIẾT CÔNG VIỆC - ${worker.workerName}`;
        detailWs.mergeCells('A1:F1');
        
        detailWs.getRow(2).font = { bold: true, size: 12 };
        detailWs.getCell('A2').value = `Tháng: ${month}/${year}`;
        
        // Table headers
        detailWs.getRow(4).font = { bold: true, size: 11 };
        detailWs.getRow(4).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' }
        };
        detailWs.addRow(["Ngày", "Số ngày", "Dự án", "Bữa ăn", "Ghi chú"]);
        
        // Add daily details - với error handling
        if (worker.dailyDetails && worker.dailyDetails.length > 0) {
          worker.dailyDetails.forEach(detail => {
            try {
              const mealText = detail.meal === 'FULL_DAY' ? 'Cả ngày' : 
                              detail.meal === 'HALF_DAY' ? 'Nửa ngày' : 'Không ăn';
              // Format date as dd/mm/yyyy
              const date = new Date(detail.date);
              const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
              detailWs.addRow([
                formattedDate,
                detail.dayFraction,
                detail.projectName || 'Không xác định',
                mealText,
                ''
              ]);
            } catch (detailError) {
              console.warn('Error processing daily detail:', detail, detailError);
              detailWs.addRow([
                detail.date || '',
                detail.dayFraction || 0,
                detail.projectName || 'Không xác định',
                detail.meal || '',
                ''
              ]);
            }
          });
        }
        
        // Summary row
        const summaryRow = detailWs.addRow([
          "TỔNG", 
          worker.totalDays, 
          "", 
          "", 
          ""
        ]);
        summaryRow.font = { bold: true };
        summaryRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6FFE6' }
        };
        
        // Auto-fit columns
        detailWs.columns.forEach(column => {
          column.width = 20;
        });
        
        // Add borders
        detailWs.eachRow((row, rowNumber) => {
          if (rowNumber >= 4) { // Skip header rows
            row.eachCell((cell, colNumber) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
          }
        });
          } catch (workerError) {
            console.error('Error creating detail sheet for worker:', worker.workerName, workerError);
            // Skip this worker's detail sheet
          }
        });
      }
      
      console.log('Writing Excel file...');
      const buf = await wb.xlsx.writeBuffer();
      console.log('Excel buffer created, size:', buf.byteLength);
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bang-cong-chi-tiet-${year}-${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Excel file downloaded');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Có lỗi xảy ra khi xuất Excel');
    } finally {
      setExportingExcel(false);
    }
  }

  async function exportPDF() {
    setExportingPDF(true);
    try {
      // Kiểm tra dữ liệu trước khi export
      if (!items || items.length === 0) {
        alert('Không có dữ liệu để xuất PDF');
        return;
      }
      
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      
      let currentY = 40;
      
      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`BẢNG CÔNG CHI TIẾT THÁNG ${month}/${year}`, 40, currentY);
      currentY += 30;
      
      // Date info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString('vi-VN');
      doc.text(`Ngày xuất: ${currentDate}`, 40, currentY);
      currentY += 20;
      
      // Summary table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("TỔNG KẾT", 40, currentY);
      currentY += 20;
      
      const summaryRows = items.map(it => {
        // Find worker details to get specific work dates - với error handling
        let workDaysText = it.totalDays.toString();
        
        try {
          const workerDetail = workerDetails?.find(wd => wd.workerId === it.workerId);
          
          if (workerDetail && workerDetail.dailyDetails && workerDetail.dailyDetails.length > 0) {
            // Format work days as specific dates
            const workDates = workerDetail.dailyDetails.map(detail => {
              try {
                const date = new Date(detail.date);
                return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
              } catch (dateError) {
                console.warn('Error formatting date in PDF:', detail.date, dateError);
                return detail.date || '';
              }
            });
            workDaysText = workDates.join(', ');
          }
        } catch (detailError) {
          console.warn('Error processing worker details for PDF:', it.fullName, detailError);
          // Fallback to simple total days
          workDaysText = it.totalDays.toString();
        }
        
        return [
          it.fullName, 
          workDaysText, 
          formatVnd(it.wageTotalVnd), 
          formatVnd(it.mealTotalVnd), 
          formatVnd(it.allowanceVnd), 
          formatVnd(it.payableVnd)
        ];
      });
      
      // Add total row
      summaryRows.push(["TỔNG", "", "", "", "", formatVnd(total)]);
      
      autoTable(doc, { 
        startY: currentY, 
        head: [["Họ tên", "Ngày công", "Lương", "Ăn", "Phụ cấp", "Phải trả"]], 
        body: summaryRows,
        headStyles: {
          fillColor: [230, 230, 250],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 50, halign: 'right' },
          3: { cellWidth: 50, halign: 'right' },
          4: { cellWidth: 50, halign: 'right' },
          5: { cellWidth: 50, halign: 'right' }
        }
      });
      
      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
      
      // Detail for each worker - với error handling
      if (workerDetails && workerDetails.length > 0) {
        workerDetails.forEach((worker, index) => {
          try {
        // Check if we need a new page
        if (currentY > 600) {
          doc.addPage();
          currentY = 40;
        }
        
        // Worker header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`CHI TIẾT: ${worker.workerName}`, 40, currentY);
        currentY += 20;
        
        // Daily details table - với error handling
        const detailRows = worker.dailyDetails?.map(detail => {
          try {
            const mealText = detail.meal === 'FULL_DAY' ? 'Cả ngày' : 
                            detail.meal === 'HALF_DAY' ? 'Nửa ngày' : 'Không ăn';
            // Format date as dd/mm/yyyy
            const date = new Date(detail.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            return [
              formattedDate,
              detail.dayFraction?.toString() || '0',
              detail.projectName || 'Không xác định',
              mealText
            ];
          } catch (detailError) {
            console.warn('Error processing daily detail in PDF:', detail, detailError);
            return [
              detail.date || '',
              detail.dayFraction?.toString() || '0',
              detail.projectName || 'Không xác định',
              detail.meal || ''
            ];
          }
        }) || [];
        
        // Add summary row
        detailRows.push(["TỔNG", worker.totalDays.toString(), "", ""]);
        
        autoTable(doc, { 
          startY: currentY, 
          head: [["Ngày", "Số ngày", "Dự án", "Bữa ăn"]], 
          body: detailRows,
          headStyles: {
            fillColor: [200, 200, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248]
          },
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 80 },
            3: { cellWidth: 40 }
          }
        });
        
        currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
          } catch (workerError) {
            console.error('Error creating PDF detail for worker:', worker.workerName, workerError);
            // Skip this worker's detail
          }
        });
      }
      
      // Final summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Tổng chi phí lương tháng ${month}/${year}: ${formatVnd(total)}`, 40, currentY);
      
      // Company info
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Civiwork Management System", 40, currentY + 30);
      
      doc.save(`bang-cong-chi-tiet-${year}-${month}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Có lỗi xảy ra khi xuất PDF');
    } finally {
      setExportingPDF(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-md">
      <PageHeader title="Bảng công/thanh toán tháng" />
      <div className="p-4">
        
        {/* Date Selection and Action Buttons */}
        <ModernCard className="mb-6 p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
              <input 
                type="number" 
                value={year} 
                onChange={e=>setYear(Number(e.target.value))} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
              <input 
                type="number" 
                min={1} 
                max={12} 
                value={month} 
                onChange={e=>setMonth(Number(e.target.value))} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <ModernButton onClick={load} className="w-full bg-gray-800 hover:bg-gray-900">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </ModernButton>
            <ModernButton 
              type="button" 
              onClick={exportExcel} 
              disabled={exportingExcel}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {exportingExcel ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đang xuất Excel...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Xuất Excel
                </>
              )}
            </ModernButton>
            <ModernButton 
              type="button" 
              onClick={exportPDF} 
              disabled={exportingPDF}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {exportingPDF ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đang xuất PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Xuất PDF
                </>
              )}
            </ModernButton>
            <a 
              href="/payroll/explanation" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center inline-flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Giải thích
            </a>
          </div>
        </ModernCard>
        {/* Allowance Information Card */}
        <ModernCard className="mb-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-blue-800 mb-2">Về phụ cấp đội trưởng:</div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• Phụ cấp được tính <strong>một lần cho toàn tháng</strong></div>
                <div>• Không phụ thuộc vào số dự án tham gia</div>
                <div>• Chỉ áp dụng cho đội trưởng (1.500.000đ/tháng)</div>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Error State */}
        {error && (
          <ModernCard className="mb-6 p-4 bg-red-50 border-red-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div className="text-red-800">{error}</div>
            </div>
          </ModernCard>
        )}

        {/* Loading State */}
        {loading && (
          <ModernCard className="mb-6 p-4">
            <div className="text-center">
              <div className="text-gray-500">Đang tải dữ liệu bảng công...</div>
            </div>
          </ModernCard>
        )}

        {/* Payroll Items */}
        <div className="space-y-4">
          {!loading && !error && items.map((it, idx) => (
            <ModernCard key={idx} className="p-4 hover:shadow-lg transition-shadow">
              <div className="font-semibold text-lg text-gray-900 mb-3">{it.fullName}</div>
              <div className="text-sm text-gray-600 mb-4">Ngày công: {it.totalDays} ngày</div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Lương ({it.totalDays} ngày):</span>
                  <span className="font-medium text-gray-900">{formatVnd(it.wageTotalVnd)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Chi phí ăn uống:</span>
                  <span className="font-medium text-gray-900">{formatVnd(it.mealTotalVnd)}</span>
                </div>
                {it.allowanceVnd > 0 && (
                  <div className="flex justify-between items-center text-blue-600">
                    <span className="font-medium">Phụ cấp tháng (cố định):</span>
                    <span className="font-semibold">{formatVnd(it.allowanceVnd)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-gray-900">Tổng phải trả:</span>
                    <span className="font-bold text-xl text-green-600">{formatVnd(it.payableVnd)}</span>
                  </div>
                </div>
              </div>
            </ModernCard>
          ))}
          
          {/* Total Summary */}
          {!loading && !error && (
            <ModernCard className="p-6 bg-green-50 border-green-200">
              <div className="text-center">
                <div className="text-sm text-green-700 mb-2">Tổng chi phí lương tháng {month}/{year}</div>
                <div className="text-3xl font-bold text-green-800">{formatVnd(total)}</div>
              </div>
            </ModernCard>
          )}
        </div>
      </div>
    </div>
  );
}


