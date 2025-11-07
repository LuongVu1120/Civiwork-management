"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem, DebouncedInput, ModernAutocomplete, RHFInput, RHFAutocomplete } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { usePersistedParams } from "@/app/hooks/usePersistedParams";
import { Toast } from "@/app/lib/validation";
import { ConfirmDialog } from "@/app/lib/modern-components";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";
import { useForm, Controller } from "react-hook-form";

type Receipt = { id: string; date: string; amountVnd: number; description?: string | null; projectId: string };
type Project = { id: string; name: string; isCompleted?: boolean };

export default function ReceiptsPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [list, setList] = useState<Receipt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);
  const [loading, setLoading] = useState(true);
  const { values: persisted, setParam } = usePersistedParams({
    q: { type: "string", default: "" },
    limit: { type: "number", default: 10 },
    projectIdFilter: { type: "string", default: "" },
    startDate: { type: "string", default: "" },
    endDate: { type: "string", default: "" }
  });
  const [searchTerm, setSearchTerm] = useState(persisted.q);
  const [itemsPerPage, setItemsPerPage] = useState(persisted.limit);
  const [filterProjectId, setFilterProjectId] = useState<string>(persisted.projectIdFilter);
  const [startDateFilter, setStartDateFilter] = useState<string>(persisted.startDate);
  const [endDateFilter, setEndDateFilter] = useState<string>(persisted.endDate);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; id?: string }>({ open: false });

  type ReceiptForm = { date: string; projectId: string; amountVnd: string; description: string };
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ReceiptForm>({
    defaultValues: { date: new Date().toISOString().slice(0,10), projectId: "", amountVnd: "0", description: "" }
  });

  async function refresh(pageParam: number = 1, limitParam: number = itemsPerPage) {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(pageParam),
        limit: String(limitParam),
        projectId: filterProjectId || "",
        startDate: startDateFilter || "",
        endDate: endDateFilter || ""
      });
      const [receiptsData, projectsData] = await Promise.all([
        authenticatedFetch(`/api/receipts?${query.toString()}`, { cache: "no-store" }).then(async res => {
          if (!res.ok) {
            if (res.status === 401) {
              window.location.href = '/auth/login';
              return { items: [], total: 0 };
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        }),
        authenticatedFetch("/api/projects", { 
          cache: "no-store"
        }).then(async r => {
          if (!r.ok) {
            if (r.status === 401) {
              window.location.href = '/auth/login';
              return [];
            }
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          const data = await r.json();
          return Array.isArray(data) ? data : data.items || [];
        }),
      ]);
      setList(receiptsData.items || receiptsData);
      if (typeof receiptsData.total === 'number') setTotalCount(receiptsData.total);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setToast({ message: "Có lỗi xảy ra khi tải dữ liệu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // Chỉ lọc theo ô tìm kiếm (các bộ lọc khác đã áp dụng ở server)
  const filteredReceipts = list.filter(receipt => {
    const searchLower = searchTerm.toLowerCase();
    return (
      receipt.description?.toLowerCase().includes(searchLower) ||
      new Date(receipt.date).toLocaleDateString('vi-VN').includes(searchLower)
    );
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredReceipts, itemsPerPage, searchTerm ? undefined : totalCount);

  useEffect(() => {
    refresh(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // Reset to first page when filters change and persist to URL
  useEffect(() => {
    setParam("q", searchTerm);
    setParam("limit", itemsPerPage);
    setParam("projectIdFilter", filterProjectId || "");
    setParam("startDate", startDateFilter || "");
    setParam("endDate", endDateFilter || "");
    resetPage();
  }, [searchTerm, itemsPerPage, filterProjectId, startDateFilter, endDateFilter]);

  async function createReceipt(data: ReceiptForm) {
    const selected = projects.find(p=>p.id===data.projectId);
    if (selected?.isCompleted) {
      setToast({ message: "Công trình đã hoàn thành. Không thể thêm thu tiền mới.", type: "error" });
      return;
    }
    try {
      await authenticatedFetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(data.date + "T00:00:00.000Z"),
          projectId: data.projectId,
          amountVnd: Number(String(data.amountVnd).replace(/\D/g, "")),
          description: data.description ? data.description : null,
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

  async function updateReceipt(data: ReceiptForm) {
    if (!editingReceipt) return;
    const selected = projects.find(p=>p.id===data.projectId);
    if (selected?.isCompleted) {
      setToast({ message: "Công trình đã hoàn thành. Không thể cập nhật thu tiền.", type: "error" });
      return;
    }
    
    try {
      await authenticatedFetch("/api/receipts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingReceipt.id,
          date: new Date(data.date + "T00:00:00.000Z"),
          projectId: data.projectId,
          amountVnd: Number(String(data.amountVnd).replace(/\D/g, "")),
          description: data.description ? data.description : null,
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
    setConfirmState({ open: true, id });
  }

  async function doDeleteReceipt(id: string) {
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
    reset({ date: new Date().toISOString().slice(0,10), projectId: "", amountVnd: "0", description: "" });
    setShowAddForm(false);
    setEditingReceipt(null);
  }

  function startEdit(receipt: Receipt) {
    setEditingReceipt(receipt);
    reset({
      date: receipt.date.slice(0,10),
      projectId: receipt.projectId,
      amountVnd: new Intl.NumberFormat('vi-VN').format(receipt.amountVnd),
      description: receipt.description || ""
    });
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
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 mx-auto max-w-2xl md:max-w-3xl">
      <PageHeader title="Thu tiền" />
      <div className="p-4">
        
        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <DebouncedInput
            value={searchTerm}
            onDebouncedChange={setSearchTerm}
            placeholder="Tìm kiếm theo mô tả hoặc ngày..."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ModernAutocomplete
              options={projects.map(p=>({ id: p.id, label: p.name }))}
              value={filterProjectId}
              onChange={setFilterProjectId}
              placeholder="Lọc theo dự án..."
            />
            <ModernInput type="date" value={startDateFilter} onChange={e=>setStartDateFilter(e.target.value)} />
            <ModernInput type="date" value={endDateFilter} onChange={e=>setEndDateFilter(e.target.value)} />
          </div>
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
          <ModernForm onSubmit={handleSubmit(editingReceipt ? updateReceipt : createReceipt)} className="mb-6">
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
              <RHFInput control={control} name="date" rules={{ required: true }} type="date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công trình</label>
              <RHFAutocomplete
                control={control}
                name="projectId"
                rules={{ required: true }}
                options={(showCompletedProjects ? projects : projects.filter(p=>!p.isCompleted)).map(p=>({ id: p.id, label: p.name + (p.isCompleted ? " (đã hoàn thành)" : "") }))}
                placeholder="Chọn dự án..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
              <Controller
                name="amountVnd"
                control={control}
                rules={{ required: true, min: 0 }}
                render={({ field, fieldState }) => (
                  <ModernInput
                    type="text"
                    inputMode="numeric"
                    placeholder="Ví dụ: 1.000.000"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      const formatted = new Intl.NumberFormat('vi-VN').format(Number(digits || 0));
                      field.onChange(formatted);
                    }}
                    error={!!fieldState.error}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <RHFInput control={control} name="description" placeholder="Mô tả thu tiền (tuỳ chọn)" />
            </div>
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1" disabled={isSubmitting}>
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
      <ConfirmDialog
        open={confirmState.open}
        title="Xóa thu tiền"
        message="Bạn có chắc chắn muốn xóa bản ghi thu tiền này?"
        confirmText="Xóa"
        cancelText="Hủy"
        onCancel={() => { setConfirmState({ open: false }); setToast({ message: 'Đã hủy thao tác', type: 'info' }); }}
        onConfirm={() => { const id = confirmState.id!; setConfirmState({ open: false }); doDeleteReceipt(id); }}
      />
    </div>
  );
}