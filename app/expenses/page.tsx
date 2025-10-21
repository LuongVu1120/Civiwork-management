"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";

type Expense = { id: string; date: string; amountVnd: number; category: string; description?: string | null };
type Project = { id: string; name: string };

const CATEGORIES = [
  { value: "WAGE", label: "Lương" },
  { value: "MEAL", label: "Ăn uống" },
  { value: "MATERIAL", label: "Vật tư" },
  { value: "SUBCONTRACT", label: "Thuê ngoài" },
  { value: "TOOLING", label: "Dụng cụ" },
  { value: "MISC", label: "Khác" }
] as const;

export default function ExpensesPage() {
  const [list, setList] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [projectId, setProjectId] = useState<string>("");
  const [amountVnd, setAmountVnd] = useState<number>(0);
  const [category, setCategory] = useState<string>("MISC");
  const [description, setDescription] = useState<string>("");

  async function refresh() {
    const [e, p] = await Promise.all([
      fetch("/api/expenses", { cache: "no-store" }).then(res=>res.json()),
      fetch("/api/projects", { cache: "no-store" }).then(res=>res.json()),
    ]);
    setList(e);
    setProjects(p);
    if (!projectId && p[0]) setProjectId(p[0].id);
  }

  useEffect(() => { refresh(); }, []);

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(date + "T00:00:00.000Z"),
        projectId,
        category,
        amountVnd,
        description: description || null,
      }),
    });
    setAmountVnd(0);
    setDescription("");
    await refresh();
  }

  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
      <PageHeader title="Chi tiền" />
      <div className="p-4">

      <form onSubmit={createExpense} className="bg-white p-3 rounded-xl border shadow-sm mb-4 flex flex-col gap-2">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded px-3 py-2" />
        <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border rounded px-3 py-2">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="border rounded px-3 py-2">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="number" value={amountVnd} onChange={e=>setAmountVnd(Number(e.target.value))} className="border rounded px-3 py-2" placeholder="Số tiền (VND)" />
        <input value={description} onChange={e=>setDescription(e.target.value)} className="border rounded px-3 py-2" placeholder="Mô tả (tuỳ chọn)" />
        <button className="rounded-lg bg-black text-white py-2">Thêm</button>
      </form>

      <div className="space-y-2">
        {list.map(e => {
          const categoryLabel = CATEGORIES.find(c => c.value === e.category)?.label || e.category;
          return (
            <div key={e.id} className="bg-white p-3 rounded-xl border shadow-sm">
              <div className="font-medium">{formatVnd(e.amountVnd)} · {categoryLabel}</div>
              <div className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString()} · {e.description || ""}</div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

