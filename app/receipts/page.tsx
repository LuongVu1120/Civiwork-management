"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { Toast } from "@/app/lib/validation";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";

type Receipt = { id: string; date: string; amountVnd: number; description?: string | null; projectId: string };
type Project = { id: string; name: string };

export default function ReceiptsPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [list, setList] = useState<Receipt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [projectId, setProjectId] = useState<string>("");
  const [amountVnd, setAmountVnd] = useState<number>(0);
  const [description, setDescription] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        authenticatedFetch("/api/receipts", { 
          cache: "no-store"
        }).then(async res => {
          if (!res.ok) {
            if (res.status === 401) {
              window.location.href = '/auth/login';
              return [];
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        }),
        authenticatedFetch("/api/projects", { 
          cache: "no-store"
        }).then(async res => {
          if (!res.ok) {
            if (res.status === 401) {
              window.location.href = '/auth/login';
              return [];
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        }),
      ]);
      setList(r);
      setProjects(p);
      if (!projectId && p[0]) setProjectId(p[0].id);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setToast({ message: "Có lỗi xảy ra khi tải dữ liệu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // Filter receipts based on search
  const filteredReceipts = list.filter(receipt => 
    receipt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(receipt.date).toLocaleDateString('vi-VN').includes(searchTerm.toLowerCase())
  );

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredReceipts, itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    resetPage();
  }, [searchTerm, itemsPerPage]);

  async function createReceipt(e: React.FormEvent) {
    e.preventDefault();
    try {
      await authenticatedFetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(date + "T00:00:00.000Z"),
          projectId,
          amountVnd,
          description: description || null,
        }),
      });
      resetForm();
      await refresh();
      setToast({ message: "Thêm thu tiền thành công!", type: "success" });
    } catch (error) {
      console.error('Error creating receipt:', error);
      setToast({ message: "Có lỗi xảy ra khi thêm thu tiền", type: "error" });
    }
  }

  async function updateReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!editingReceipt) return;
    
    try {
      await authenticatedFetch("/api/receipts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingReceipt.id,
          date: new Date(date + "T00:00:00.000Z"),
          projectId,
          amountVnd,
          description: description || null,
        }),
      });
      resetForm();
      await refresh();
      setToast({ message: "Cập nhật thu tiền thành công!", type: "success" });
    } catch (error) {
      console.error('Error updating receipt:', error);
      setToast({ message: "Có lỗi xảy ra khi cập nhật thu tiền", type: "error" });
    }
  }

  async function deleteReceipt(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi thu tiền này?")) return;
    
    try {
      await authenticatedFetch(`/api/receipts?id=${id}`, {
        method: "DELETE",
      });
      await refresh();
      setToast({ message: "Xóa thu tiền thành công!", type: "success" });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      setToast({ message: "Có lỗi xảy ra khi xóa thu tiền", type: "error" });
    }
  }

  function resetForm() {
    setDate(new Date().toISOString().slice(0,10));
    setProjectId("");
    setAmountVnd(0);
    setDescription("");
    setShowAddForm(false);
    setEditingReceipt(null);
  }

  function startEdit(receipt: Receipt) {
    setEditingReceipt(receipt);
    setDate(receipt.date.slice(0,10));
    setProjectId(receipt.projectId);
    setAmountVnd(receipt.amountVnd);
    setDescription(receipt.description || "");
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
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 mx-auto max-w-md">
      <PageHeader title="Thu tiền" />
      <div className="p-4">
        
        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <ModernInput
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo mô tả hoặc ngày..."
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
          <ModernForm onSubmit={editingReceipt ? updateReceipt : createReceipt} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReceipt ? "Sửa bản ghi thu tiền" : "Thêm bản ghi thu tiền mới"}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
              <ModernSelect 
                value={projectId} 
                onChange={e=>setProjectId(e.target.value)}
              >
                <option value="">Chọn dự án...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </ModernSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
              <ModernInput 
                type="number" 
                value={amountVnd} 
                onChange={e=>setAmountVnd(Number(e.target.value))} 
                placeholder="Ví dụ: 1000000"
                min={0}
                step={1000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <ModernInput 
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
                placeholder="Mô tả thu tiền (tuỳ chọn)"
              />
            </div>
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                {editingReceipt ? "Cập nhật" : "Thêm thu tiền"}
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
        {!loading && filteredReceipts.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredReceipts.length)} trong {filteredReceipts.length} bản ghi thu tiền
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">Đang tải...</div>
            </ModernCard>
          ) : filteredReceipts.length === 0 ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm ? "Không tìm thấy bản ghi thu tiền nào" : "Chưa có bản ghi thu tiền nào"}
              </div>
            </ModernCard>
          ) : (
            paginatedItems.map(r => {
              const projectName = projects.find(p => p.id === r.projectId)?.name || "Không xác định";
              
              return (
                <ModernListItem key={r.id} className="hover:scale-105">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900 mb-1">
                        {formatVnd(r.amountVnd)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(r.date).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        📁 {projectName}
                      </div>
                      {r.description && (
                        <div className="text-sm text-gray-500">
                          {r.description}
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => startEdit(r)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteReceipt(r.id)}
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
    </div>
  );
}