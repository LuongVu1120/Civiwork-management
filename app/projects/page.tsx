"use client";
import { useEffect, useState } from "react";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernForm, ModernListItem, ModernSelect, ConfirmDialog, DebouncedInput } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { usePersistedParams } from "@/app/hooks/usePersistedParams";
import { Toast } from "@/app/lib/validation";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";

type Project = { id: string; name: string; clientName?: string | null; isCompleted?: boolean; completedAt?: string | null };

export default function ProjectsPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [list, setList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { values: persisted, setParam } = usePersistedParams({
    q: { type: "string", default: "" },
    limit: { type: "number", default: 10 },
    status: { type: "string", default: "all" }
  });
  const [searchTerm, setSearchTerm] = useState(persisted.q);
  const [itemsPerPage, setItemsPerPage] = useState(persisted.limit);
  const [status, setStatus] = useState<string>(persisted.status);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; type: "delete" | "complete" | null; id?: string }>({ open: false, type: null });

  async function refresh() {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/projects?status=${encodeURIComponent(status)}`, { 
        cache: "no-store"
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/auth/login';
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      setList(await res.json());
    } catch (error) {
      console.error('Error loading projects:', error);
      setToast({ message: "Có lỗi xảy ra khi tải dữ liệu", type: "error" });
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { refresh(); }, [status]);

  // Filter projects based on search
  const filteredProjects = list.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.clientName && project.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredProjects, itemsPerPage);

  // Reset to first page when filters change and persist to URL
  useEffect(() => {
    setParam("q", searchTerm);
    setParam("limit", itemsPerPage);
    setParam("status", status);
    resetPage();
  }, [searchTerm, itemsPerPage, status]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      await authenticatedFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, clientName: clientName || null }),
      });
      resetForm();
      await refresh();
      setToast({ message: "Thêm công trình thành công!", type: "success" });
    } catch (error) {
      console.error('Error creating project:', error);
      setToast({ message: "Có lỗi xảy ra khi thêm công trình", type: "error" });
    }
  }

  async function updateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProject) return;
    
    try {
      await authenticatedFetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProject.id,
          name,
          clientName: clientName || null,
        }),
      });
      resetForm();
      await refresh();
      setToast({ message: "Cập nhật công trình thành công!", type: "success" });
    } catch (error) {
      console.error('Error updating project:', error);
      setToast({ message: "Có lỗi xảy ra khi cập nhật công trình", type: "error" });
    }
  }

  async function deleteProject(id: string) {
    setConfirmState({ open: true, type: "delete", id });
  }
    
  async function doDelete(id: string) {
    try {
      await authenticatedFetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });
      await refresh();
      setToast({ message: "Xóa công trình thành công!", type: "success" });
    } catch (error) {
      console.error('Error deleting project:', error);
      setToast({ message: "Có lỗi xảy ra khi xóa công trình", type: "error" });
    }
  }

  async function completeProject(id: string) {
    setConfirmState({ open: true, type: "complete", id });
  }

  async function doComplete(id: string) {
    try {
      await authenticatedFetch(`/api/projects/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      await refresh();
      setToast({ message: "Đã đánh dấu hoàn thành", type: "success" });
    } catch (error) {
      console.error('Error completing project:', error);
      setToast({ message: "Không thể hoàn thành công trình", type: "error" });
    }
  }

  function resetForm() {
    setName("");
    setClientName("");
    setShowAddForm(false);
    setEditingProject(null);
  }

  function startEdit(project: Project) {
    setEditingProject(project);
    setName(project.name);
    setClientName(project.clientName || "");
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
      <PageHeader title="Công trình" />
      <div className="p-4">
        
        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <DebouncedInput
            value={searchTerm}
            onDebouncedChange={setSearchTerm}
            placeholder="Tìm kiếm theo tên công trình hoặc chủ đầu tư..."
          />
          <div className="grid grid-cols-2 gap-3">
            <ModernSelect value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="active">Đang triển khai</option>
              <option value="completed">Đã hoàn thành</option>
            </ModernSelect>
          <ModernSelect
            value={itemsPerPage}
            onChange={e => setItemsPerPage(Number(e.target.value))}
          >
            <option value={5}>5/trang</option>
            <option value={10}>10/trang</option>
            <option value={20}>20/trang</option>
            <option value={50}>50/trang</option>
          </ModernSelect>
          </div>
        </ModernCard>

        {/* Add/Edit Form */}
        {showAddForm && (
          <ModernForm onSubmit={editingProject ? updateProject : createProject} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProject ? "Sửa công trình" : "Thêm công trình mới"}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên công trình</label>
              <ModernInput 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                placeholder="Tên công trình" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đầu tư</label>
              <ModernInput 
                value={clientName} 
                onChange={e=>setClientName(e.target.value)} 
                placeholder="Chủ đầu tư (tuỳ chọn)" 
              />
            </div>
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                {editingProject ? "Cập nhật" : "Thêm công trình"}
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

        {/* Results summary */}
        {!loading && filteredProjects.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} trong {filteredProjects.length} công trình
          </div>
        )}
        
        <div className="space-y-3">
          {loading ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">Đang tải...</div>
            </ModernCard>
          ) : filteredProjects.length === 0 ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm ? "Không tìm thấy công trình nào" : "Chưa có công trình nào"}
              </div>
            </ModernCard>
          ) : (
            paginatedItems.map(p => (
              <ModernListItem key={p.id} className="hover:scale-105">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900 mb-1">{p.name}</div>
                    <div className="flex items-center gap-2 mb-3">
                    {p.clientName && (
                        <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                          {p.clientName}
                        </span>
                      )}
                      {p.isCompleted && (
                        <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">Đã hoàn thành</span>
                      )}
                      </div>
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
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => startEdit(p)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {!p.isCompleted && (
                      <button
                        onClick={() => completeProject(p.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Hoàn thành"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => deleteProject(p.id)}
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
            ))
          )}
        </div>

        {/* Pagination */}
        <MobilePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {!showAddForm && (
        <FloatingActionButton onClick={() => setShowAddForm(true)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </FloatingActionButton>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.type === 'delete' ? 'Xóa công trình' : 'Hoàn thành công trình'}
        message={confirmState.type === 'delete' ? 'Bạn có chắc chắn muốn xóa công trình này?' : 'Đánh dấu công trình này là đã hoàn thành?'}
        confirmText={confirmState.type === 'delete' ? 'Xóa' : 'Hoàn thành'}
        cancelText="Hủy"
        onCancel={() => { setConfirmState({ open: false, type: null }); setToast({ message: 'Đã hủy thao tác', type: 'info' }); }}
        onConfirm={() => {
          const id = confirmState.id!;
          setConfirmState({ open: false, type: null });
          if (confirmState.type === 'delete') doDelete(id);
          if (confirmState.type === 'complete') doComplete(id);
        }}
      />
    </div>
  );
}


