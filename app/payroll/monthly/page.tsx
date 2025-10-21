"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";

type Item = { fullName: string; totalDays: number; wageTotalVnd: number; mealTotalVnd: number; allowanceVnd: number; payableVnd: number };

export default function PayrollMonthlyPage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);

  async function load() {
    const res = await fetch(`/api/payroll/monthly?year=${year}&month=${month}`, { cache: "no-store" });
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.totalPayableVnd || 0);
  }

  useEffect(() => { load(); }, [year, month]);

  async function exportExcel() {
    const ExcelJS = (await import("exceljs")).default || (await import("exceljs"));
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`BangCong_${year}_${month}`);
    ws.addRow(["Họ tên", "Ngày công", "Lương", "Ăn", "Phụ cấp", "Phải trả"]);
    items.forEach(it => ws.addRow([it.fullName, it.totalDays, it.wageTotalVnd, it.mealTotalVnd, it.allowanceVnd, it.payableVnd]));
    ws.addRow(["Tổng", "", "", "", "", total]);
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bang-cong-${year}-${month}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.text(`Bảng công ${month}/${year}`, 40, 40);
    const rows = items.map(it => [it.fullName, it.totalDays, formatVnd(it.wageTotalVnd), formatVnd(it.mealTotalVnd), formatVnd(it.allowanceVnd), formatVnd(it.payableVnd)]);
    autoTable(doc, { startY: 60, head: [["Họ tên", "Ngày", "Lương", "Ăn", "Phụ cấp", "Phải trả"]], body: rows });
    doc.text(`Tổng phải trả: ${formatVnd(total)}`, 40, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24);
    doc.save(`bang-cong-${year}-${month}.pdf`);
  }

  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
      <PageHeader title="Bảng công/thanh toán tháng" />
      <div className="p-4">
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-3 grid grid-cols-2 gap-2">
        <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="border rounded px-2 py-2" />
        <input type="number" min={1} max={12} value={month} onChange={e=>setMonth(Number(e.target.value))} className="border rounded px-2 py-2" />
        <button onClick={load} className="rounded bg-black text-white py-2">Làm mới</button>
        <div className="flex gap-2">
          <button type="button" onClick={exportExcel} className="rounded bg-emerald-600 text-white py-2 px-3">Xuất Excel</button>
          <button type="button" onClick={exportPDF} className="rounded bg-indigo-600 text-white py-2 px-3">Xuất PDF</button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="bg-white p-3 rounded-xl border shadow-sm">
            <div className="font-medium">{it.fullName}</div>
            <div className="text-sm text-gray-500">Ngày công: {it.totalDays}</div>
            <div className="text-sm">Lương: {formatVnd(it.wageTotalVnd)} · Ăn: {formatVnd(it.mealTotalVnd)} · Phụ cấp: {formatVnd(it.allowanceVnd)}</div>
            <div className="font-semibold">Phải trả: {formatVnd(it.payableVnd)}</div>
          </div>
        ))}
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="font-semibold">Tổng phải trả: {formatVnd(total)}</div>
        </div>
      </div>
      </div>
    </div>
  );
}


