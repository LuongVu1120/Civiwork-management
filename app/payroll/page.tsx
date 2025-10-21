"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";

type Worker = { id: string; fullName: string };

export default function PayrollPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerId, setWorkerId] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [result, setResult] = useState<{ totalDays: number; wageTotalVnd: number; mealTotalVnd: number; allowanceVnd: number; payableVnd: number } | null>(null);

  useEffect(() => {
    fetch("/api/workers", { cache: "no-store" })
      .then(r=>r.json())
      .then((w: Worker[]) => { setWorkers(w); if (w[0]) setWorkerId(w[0].id); });
  }, []);

  async function run() {
    if (!workerId) return;
    const url = `/api/payroll?workerId=${encodeURIComponent(workerId)}&year=${year}&month=${month}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    setResult(data);
  }

  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
      <PageHeader title="Báo cáo lương tháng" />
      <div className="p-4">
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-4 grid grid-cols-2 gap-2">
        <select value={workerId} onChange={e=>setWorkerId(e.target.value)} className="border rounded px-3 py-2 col-span-2">
          {workers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
        </select>
        <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="border rounded px-3 py-2" />
        <input type="number" min={1} max={12} value={month} onChange={e=>setMonth(Number(e.target.value))} className="border rounded px-3 py-2" />
        <button onClick={run} className="rounded-lg bg-black text-white py-2 col-span-2">Tính lương</button>
      </div>

      {result && (
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="font-medium">Tổng ngày: {result.totalDays}</div>
          <div>Lương: {formatVnd(result.wageTotalVnd)}</div>
          <div>Tiền ăn: {formatVnd(result.mealTotalVnd)}</div>
          <div>Phụ cấp: {formatVnd(result.allowanceVnd)}</div>
          <div className="font-semibold">Phải trả: {formatVnd(result.payableVnd)}</div>
        </div>
      )}
      </div>
    </div>
  );
}


