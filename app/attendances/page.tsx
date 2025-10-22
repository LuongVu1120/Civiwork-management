"use client";
import { useEffect, useState } from "react";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";
import { SkeletonList } from "@/app/lib/skeleton";
import { MobilePagination, usePagination } from "@/app/lib/pagination";

type Attendance = { 
  id: string; 
  date: string; 
  workerId: string; 
  projectId: string; 
  dayFraction: number; 
  meal: "FULL_DAY" | "HALF_DAY" | "NONE";
  worker?: { id: string; fullName: string };
  project?: { id: string; name: string };
};
type Worker = { id: string; fullName: string };
type Project = { id: string; name: string };

export default function AttendancesPage() {
  const [list, setList] = useState<Attendance[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [workerId, setWorkerId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [dayFraction, setDayFraction] = useState<string>("1.00");
  const [meal, setMeal] = useState<"FULL_DAY" | "HALF_DAY" | "NONE">("FULL_DAY");

  async function refresh() {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // Filter attendances based on search
  const filteredAttendances = list.filter(attendance => {
    const worker = workers.find(w => w.id === attendance.workerId);
    const project = projects.find(p => p.id === attendance.projectId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      worker?.fullName.toLowerCase().includes(searchLower) ||
      project?.name.toLowerCase().includes(searchLower) ||
      new Date(attendance.date).toLocaleDateString('vi-VN').includes(searchLower)
    );
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredAttendances, itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    resetPage();
  }, [searchTerm, itemsPerPage]);

  async function createAttendance(e: React.FormEvent) {
    e.preventDefault();
    
    if (!workerId || !projectId) {
      alert('Vui lòng chọn công nhân và dự án');
      return;
    }
    
    try {
      await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(date + "T00:00:00.000Z"),
          workerId,
          projectId,
          dayFraction: parseFloat(dayFraction),
          meal,
        }),
      });
      await refresh();
      
      // Reset form
      setDate(new Date().toISOString().slice(0,10));
      setDayFraction("1.00");
      setMeal("FULL_DAY");
    } catch (error) {
      console.error('Error creating attendance:', error);
      alert('Có lỗi xảy ra khi thêm chấm công');
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-md">
      <PageHeader title="Chấm công" />
      <div className="p-4">

        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <ModernInput
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên công nhân, dự án hoặc ngày..."
          />
          <ModernSelect
            value={itemsPerPage}
            onChange={e => setItemsPerPage(Number(e.target.value))}
          >
            <option value={5}>5/trang</option>
            <option value={10}>10/trang</option>
            <option value={20}>20/trang</option>
            <option value={50}>50/trang</option>
          </ModernSelect>
        </ModernCard>

      <ModernForm onSubmit={createAttendance} className="mb-6">
        <ModernInput 
          type="date" 
          value={date} 
          onChange={e=>setDate(e.target.value)} 
        />
        <ModernSelect value={workerId} onChange={e=>setWorkerId(e.target.value)}>
          <option value="">Chọn công nhân...</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
        </ModernSelect>
        <ModernSelect value={projectId} onChange={e=>setProjectId(e.target.value)}>
          <option value="">Chọn dự án...</option>
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

        {/* Results summary */}
        {!loading && filteredAttendances.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredAttendances.length)} trong {filteredAttendances.length} bản ghi chấm công
          </div>
        )}

      <div className="space-y-3">
        {loading ? (
          <SkeletonList count={3} />
        ) : filteredAttendances.length === 0 ? (
          <ModernCard className="text-center py-8">
            <div className="text-gray-500">
              {searchTerm ? "Không tìm thấy bản ghi chấm công nào" : "Chưa có bản ghi chấm công nào"}
            </div>
          </ModernCard>
        ) : (
          paginatedItems.map(a => {
            // Use data from API if available, otherwise fallback to local data
            const worker = a.worker || workers.find(w => w.id === a.workerId);
            const project = a.project || projects.find(p => p.id === a.projectId);
            
            return (
              <ModernListItem key={a.id} className="hover:scale-105">
                <div className="font-semibold text-lg text-gray-900 mb-1">
                  {new Date(a.date).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {a.dayFraction} ngày
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {a.meal === "FULL_DAY" ? "Ăn cả ngày" : a.meal === "HALF_DAY" ? "Ăn nửa ngày" : "Không ăn"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">👷 Công nhân:</span>
                    <span className="ml-2">{worker?.fullName || 'Không xác định'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700">🏗️ Dự án:</span>
                    <span className="ml-2">{project?.name || 'Không xác định'}</span>
                  </div>
                </div>
              </ModernListItem>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <MobilePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      </div>
    </div>
  );
}


