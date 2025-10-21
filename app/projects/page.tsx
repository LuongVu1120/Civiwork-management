"use client";
import { useEffect, useState } from "react";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernForm, ModernListItem } from "@/app/lib/modern-components";

type Project = { id: string; name: string; clientName?: string | null };

export default function ProjectsPage() {
  const [list, setList] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");

  async function refresh() {
    const res = await fetch("/api/projects", { cache: "no-store" });
    setList(await res.json());
  }
  useEffect(() => { refresh(); }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, clientName: clientName || null }),
    });
    setName("");
    setClientName("");
    await refresh();
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-md">
      <PageHeader title="Công trình" />
      <div className="p-4">
        <ModernForm onSubmit={createProject} className="mb-6">
          <ModernInput 
            value={name} 
            onChange={e=>setName(e.target.value)} 
            placeholder="Tên công trình" 
            required 
          />
          <ModernInput 
            value={clientName} 
            onChange={e=>setClientName(e.target.value)} 
            placeholder="Chủ đầu tư (tuỳ chọn)" 
          />
          <ModernButton type="submit" className="w-full">
            Thêm công trình
          </ModernButton>
        </ModernForm>
        
        <div className="space-y-3">
          {list.map(p => (
            <ModernListItem key={p.id} className="hover:scale-105">
              <div className="font-semibold text-lg text-gray-900 mb-1">{p.name}</div>
              {p.clientName && (
                <div className="text-sm text-gray-600 mb-3">
                  <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                    {p.clientName}
                  </span>
                </div>
              )}
              <div className="mt-3">
                <a 
                  href={`/projects/${p.id}/cashflow`} 
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Xem dòng tiền
                </a>
              </div>
            </ModernListItem>
          ))}
        </div>
      </div>
    </div>
  );
}


