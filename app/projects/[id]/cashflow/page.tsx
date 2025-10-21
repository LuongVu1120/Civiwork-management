"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";

type Totals = {
  receipts: number;
  expenses: number;
  materials: number;
  wageEstimated: number;
  cashIn: number;
  cashOut: number;
  grossProfitEstimated: number;
};

export default function ProjectCashflowPage({ params, searchParams }: { params: { id: string }, searchParams: { year?: string; month?: string } }) {
  const projectId = params.id;
  const [data, setData] = useState<{ totals: Totals; details?: { receipts: Array<{ date: string; amountVnd: number; description?: string | null }>; expenses: Array<{ date: string; amountVnd: number; description?: string | null }>; materials: Array<{ date: string; totalVnd: number }> } } | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [year, setYear] = useState<number>(Number(searchParams?.year) || new Date().getFullYear());
  const [month, setMonth] = useState<number>(Number(searchParams?.month) || new Date().getMonth() + 1);
  const [selected, setSelected] = useState<string>(projectId);

  async function load() {
    const query = new URLSearchParams();
    if (year && month) {
      query.set("year", String(year));
      query.set("month", String(month));
    }
    const [pRes, cfRes] = await Promise.all([
      fetch(`/api/projects`, { cache: "no-store" }),
      fetch(`/api/projects/${selected}/cashflow${query.toString() ? `?${query.toString()}` : ""}`, { cache: "no-store" }),
    ]);
    setProjects(await pRes.json());
    setData(await cfRes.json());
  }

  useEffect(() => { load(); }, [selected, year, month]);

  const t = data?.totals;
  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
      <PageHeader title="Dòng tiền công trình" />
      <div className="p-4">
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-3 grid grid-cols-2 gap-2">
        <select value={selected} onChange={e=>setSelected(e.target.value)} className="border rounded px-2 py-2 col-span-2">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="border rounded px-2 py-2" />
        <input type="number" min={1} max={12} value={month} onChange={e=>setMonth(Number(e.target.value))} className="border rounded px-2 py-2" />
        <button onClick={load} className="rounded bg-black text-white py-2 col-span-2">Làm mới</button>
      </div>

      {t ? (
        <div className="space-y-2">
          <Card label="Thu (receipts)" value={formatVnd(t.receipts)} />
          <Card label="Chi (expenses)" value={formatVnd(t.expenses)} />
          <Card label="Vật tư (materials)" value={formatVnd(t.materials)} />
          <Card label="Lương ước tính (attendance)" value={formatVnd(t.wageEstimated)} />
          <Card label="Tiền vào (cashIn)" value={formatVnd(t.cashIn)} />
          <Card label="Tiền ra (cashOut)" value={formatVnd(t.cashOut)} />
          <Card label="Lợi nhuận gộp ước tính" value={formatVnd(t.grossProfitEstimated)} highlight />
          <div className="mt-2">
            <h2 className="font-medium mb-1">Chi tiết</h2>
            <DetailTable title="Receipts" rows={data?.details?.receipts || []} amountKey="amountVnd" />
            <DetailTable title="Expenses" rows={data?.details?.expenses || []} amountKey="amountVnd" />
            <DetailTable title="Materials" rows={data?.details?.materials || []} amountKey="totalVnd" />
          </div>
        </div>
      ) : <div className="text-gray-500">Đang tải…</div>}
      </div>
    </div>
  );
}

function Card({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`bg-white p-3 rounded-xl border shadow-sm ${highlight ? "border-black" : ""}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-semibold">{typeof value === "number" ? formatVnd(value) : value}</div>
    </div>
  );
}

function DetailTable({ title, rows, amountKey }: { title: string; rows: Array<{ date: string; [key: string]: unknown }>; amountKey: string }) {
  return (
    <div className="bg-white p-3 rounded-xl border shadow-sm mb-2">
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div>{new Date(r.date).toLocaleDateString()} {r.description ? `· ${r.description}` : ""}</div>
            <div className="font-medium">{formatVnd(Number(r[amountKey] ?? 0))}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-gray-400 text-sm">Không có dữ liệu</div>}
      </div>
    </div>
  );
}


