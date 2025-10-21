"use client";
import { useEffect, useState } from "react";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";

type Attendance = { id: string; date: string; workerId: string; projectId: string; dayFraction: string; meal: "FULL_DAY" | "HALF_DAY" | "NONE" };
type Worker = { id: string; fullName: string };
type Project = { id: string; name: string };

export default function AttendancesPage() {
  const [list, setList] = useState<Attendance[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [workerId, setWorkerId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [dayFraction, setDayFraction] = useState<string>("1.00");
  const [meal, setMeal] = useState<"FULL_DAY" | "HALF_DAY" | "NONE">("FULL_DAY");

  async function refresh() {
    const [a, w, p] = await Promise.all([
      fetch("/api/attendances", { cache: "no-store" }).then(r=>r.json()),
      fetch("/api/workers", { cache: "no-store" }).then(r=>r.json()),
      fetch("/api/projects", { cache: "no-store" }).then(r=>r.json()),
    ]);
    setList(a);
    setWorkers(w);
    setProjects(p);
    if (!workerId && w[0]) setWorkerId(w[0].id);
    if (!projectId && p[0]) setProjectId(p[0].id);
  }

  useEffect(() => { refresh(); }, []);

  async function createAttendance(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/attendances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(date + "T00:00:00.000Z"),
        workerId,
        projectId,
        dayFraction,
        meal,
      }),
    });
    await refresh();
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-md">
      <PageHeader title="Chấm công" />
      <div className="p-4">

      <ModernForm onSubmit={createAttendance} className="mb-6">
        <ModernInput 
          type="date" 
          value={date} 
          onChange={e=>setDate(e.target.value)} 
        />
        <ModernSelect value={workerId} onChange={e=>setWorkerId(e.target.value)}>
          {workers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
        </ModernSelect>
        <ModernSelect value={projectId} onChange={e=>setProjectId(e.target.value)}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </ModernSelect>
        <div className="grid grid-cols-2 gap-3">
          <ModernSelect value={dayFraction} onChange={e=>setDayFraction(e.target.value)}>
            <option value="1.00">Cả ngày (1.0)</option>
            <option value="0.50">Nửa ngày (0.5)</option>
          </ModernSelect>
          <ModernSelect value={meal} onChange={e=>setMeal(e.target.value as any)}>
            <option value="FULL_DAY">Ăn cả ngày</option>
            <option value="HALF_DAY">Ăn nửa ngày</option>
            <option value="NONE">Không ăn</option>
          </ModernSelect>
        </div>
        <ModernButton type="submit" className="w-full">
          Thêm chấm công
        </ModernButton>
      </ModernForm>

      <div className="space-y-3">
        {list.map(a => (
          <ModernListItem key={a.id} className="hover:scale-105">
            <div className="font-semibold text-lg text-gray-900 mb-1">
              {new Date(a.date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {a.dayFraction} ngày
              </span>
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                {a.meal === "FULL_DAY" ? "Ăn cả ngày" : a.meal === "HALF_DAY" ? "Ăn nửa ngày" : "Không ăn"}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Worker: {a.workerId} · Project: {a.projectId}
            </div>
          </ModernListItem>
        ))}
      </div>
      </div>
    </div>
  );
}


