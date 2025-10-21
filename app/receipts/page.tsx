"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";

type Receipt = { id: string; date: string; amountVnd: number; description?: string | null };
type Project = { id: string; name: string };

export default function ReceiptsPage() {
  const [list, setList] = useState<Receipt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [projectId, setProjectId] = useState<string>("");
  const [amountVnd, setAmountVnd] = useState<number>(0);
  const [description, setDescription] = useState<string>("");

  async function refresh() {
    const [r, p] = await Promise.all([
      fetch("/api/receipts", { cache: "no-store" }).then(res=>res.json()),
      fetch("/api/projects", { cache: "no-store" }).then(res=>res.json()),
    ]);
    setList(r);
    setProjects(p);
    if (!projectId && p[0]) setProjectId(p[0].id);
  }

  useEffect(() => { refresh(); }, []);

  async function createReceipt(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(date + "T00:00:00.000Z"),
        projectId,
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
      <PageHeader title="Thu tiền" />
      <div className="p-4">

      <form onSubmit={createReceipt} className="bg-white p-3 rounded-xl border shadow-sm mb-4 flex flex-col gap-2">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded px-3 py-2" />
        <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="border rounded px-3 py-2">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="number" value={amountVnd} onChange={e=>setAmountVnd(Number(e.target.value))} className="border rounded px-3 py-2" placeholder="Số tiền (VND)" />
        <input value={description} onChange={e=>setDescription(e.target.value)} className="border rounded px-3 py-2" placeholder="Mô tả (tuỳ chọn)" />
        <button className="rounded-lg bg-black text-white py-2">Thêm</button>
      </form>

      <div className="space-y-2">
        {list.map(r => (
          <div key={r.id} className="bg-white p-3 rounded-xl border shadow-sm">
            <div className="font-medium">{formatVnd(r.amountVnd)}</div>
            <div className="text-sm text-gray-500">{new Date(r.date).toLocaleDateString()} · {r.description || ""}</div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}


