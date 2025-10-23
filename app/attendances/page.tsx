"use client";
import { useEffect, useState } from "react";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";
import { SkeletonList } from "@/app/lib/skeleton";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { Toast } from "@/app/lib/validation";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [workerId, setWorkerId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [dayFraction, setDayFraction] = useState<string>("1.00");
  const [meal, setMeal] = useState<"FULL_DAY" | "HALF_DAY" | "NONE">("FULL_DAY");

  async function refresh() {
    setLoading(true);
    try {
      const [a, w, p] = await Promise.all([
        fetch("/api/attendances", { 
          cache: "no-store",
          credentials: "include"
        }).then(async r => {
          if (!r.ok) {
            if (r.status === 401) {
              window.location.href = '/auth/login';
              return [];
            }
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        }),
        fetch("/api/workers", { 
          cache: "no-store",
          credentials: "include"
        }).then(async r => {
          if (!r.ok) {
            if (r.status === 401) {
              window.location.href = '/auth/login';
              return [];
            }
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        }),
        fetch("/api/projects", { 
          cache: "no-store",
          credentials: "include"
        }).then(async r => {
          if (!r.ok) {
            if (r.status === 401) {
              window.location.href = '/auth/login';
              return [];
            }
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        }),
      ]);
      setList(a);
      setWorkers(w);
      setProjects(p);
      if (!workerId && w[0]) setWorkerId(w[0].id);
      if (!projectId && p[0]) setProjectId(p[0].id);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: "Có lỗi xảy ra khi tải dữ liệu", type: "error" });
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
      resetForm();
      await refresh();
      setToast({ message: "Thêm chấm công thành công!", type: "success" });
    } catch (error) {
      console.error('Error creating attendance:', error);
      setToast({ message: "Có lỗi xảy ra khi thêm chấm công", type: "error" });
    }
  }

  async function updateAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAttendance) return;
    
    if (!workerId || !projectId) {
      alert('Vui lòng chọn công nhân và dự án');
      return;
    }
    
    try {
      await fetch("/api/attendances", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAttendance.id,
          date: new Date(date + "T00:00:00.000Z"),
          workerId,
          projectId,
          dayFraction: parseFloat(dayFraction),
          meal,
        }),
      });
      resetForm();
      await refresh();
      setToast({ message: "Cập nhật chấm công thành công!", type: "success" });
    } catch (error) {
      console.error('Error updating attendance:', error);
      setToast({ message: "Có lỗi xảy ra khi cập nhật chấm công", type: "error" });
    }
  }

  async function deleteAttendance(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi chấm công này?")) return;
    
    try {
      await fetch(`/api/attendances?id=${id}`, {
        method: "DELETE",
      });
      await refresh();
      setToast({ message: "Xóa chấm công thành công!", type: "success" });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      setToast({ message: "Có lỗi xảy ra khi xóa chấm công", type: "error" });
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().slice(0,10));
    setWorkerId("");
    setProjectId("");
    setDayFraction("1.00");
    setMeal("FULL_DAY");
    setShowAddForm(false);
    setEditingAttendance(null);
  }

  function startEdit(attendance: Attendance) {
    setEditingAttendance(attendance);
    setDate(attendance.date.slice(0,10));
    setWorkerId(attendance.workerId);
    setProjectId(attendance.projectId);
    setDayFraction(attendance.dayFraction.toString());
    setMeal(attendance.meal);
    setShowAddForm(true);
    
    // Auto scroll to form after a short delay to ensure form is rendered
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <ModernForm onSubmit={editingAttendance ? updateAttendance : createAttendance} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAttendance ? "Sửa bản ghi chấm công" : "Thêm bản ghi chấm công mới"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
              <ModernInput 
                type="date" 
                value={date} 
                onChange={e=>setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công nhân</label>
              <ModernSelect 
                value={workerId} 
                onChange={e=>setWorkerId(e.target.value)}
              >
                <option value="">Chọn công nhân...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
              </ModernSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
              <ModernSelect 
                value={projectId} 
                onChange={e=>setProjectId(e.target.value)}
              >
                <option value="">Chọn dự án...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </ModernSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày</label>
                <ModernSelect 
                  value={dayFraction} 
                  onChange={e=>setDayFraction(e.target.value)}
                >
                  <option value="1.00">Cả ngày (1.0)</option>
                  <option value="0.50">Nửa ngày (0.5)</option>
                </ModernSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ăn uống</label>
                <ModernSelect 
                  value={meal} 
                  onChange={e=>setMeal(e.target.value as any)}
                >
                  <option value="FULL_DAY">Ăn cả ngày</option>
                  <option value="HALF_DAY">Ăn nửa ngày</option>
                  <option value="NONE">Không ăn</option>
                </ModernSelect>
              </div>
            </div>
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                {editingAttendance ? "Cập nhật" : "Thêm chấm công"}
              </ModernButton>
              <ModernButton 
                type="button" 
                variant="secondary"
                onClick={resetForm}
              >
                Hủy
              </ModernButton>
            </div>
          </ModernForm>
        )}

        {/* Quick Add Form (when not editing) */}
        {!showAddForm && (
          <ModernForm onSubmit={createAttendance} className="mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
              <ModernInput 
                type="date" 
                value={date} 
                onChange={e=>setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công nhân</label>
              <ModernSelect 
                value={workerId} 
                onChange={e=>setWorkerId(e.target.value)}
              >
                <option value="">Chọn công nhân...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
              </ModernSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
              <ModernSelect 
                value={projectId} 
                onChange={e=>setProjectId(e.target.value)}
              >
                <option value="">Chọn dự án...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </ModernSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày</label>
                <ModernSelect 
                  value={dayFraction} 
                  onChange={e=>setDayFraction(e.target.value)}
                >
                  <option value="1.00">Cả ngày (1.0)</option>
                  <option value="0.50">Nửa ngày (0.5)</option>
                </ModernSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ăn uống</label>
                <ModernSelect 
                  value={meal} 
                  onChange={e=>setMeal(e.target.value as any)}
                >
                  <option value="FULL_DAY">Ăn cả ngày</option>
                  <option value="HALF_DAY">Ăn nửa ngày</option>
                  <option value="NONE">Không ăn</option>
                </ModernSelect>
              </div>
            </div>
            <ModernButton type="submit" className="w-full">
              Thêm chấm công
            </ModernButton>
          </ModernForm>
        )}

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
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
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
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => startEdit(a)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteAttendance(a.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}


