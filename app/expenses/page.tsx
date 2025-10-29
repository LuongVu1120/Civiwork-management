"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem, DebouncedInput, ModernAutocomplete, RHFInput, RHFSelect, RHFAutocomplete } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { usePersistedParams } from "@/app/hooks/usePersistedParams";
import { Toast } from "@/app/lib/validation";
import { ConfirmDialog } from "@/app/lib/modern-components";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";
import { useForm } from "react-hook-form";

type Expense = { id: string; date: string; amountVnd: number; category: string; description?: string | null; projectId: string };
type Project = { id: string; name: string; isCompleted?: boolean };

const CATEGORIES = [
  { value: "WAGE", label: "Lương" },
  { value: "MEAL", label: "Ăn uống" },
  { value: "MATERIAL", label: "Vật tư" },
  { value: "SUBCONTRACT", label: "Thuê ngoài" },
  { value: "TOOLING", label: "Dụng cụ" },
  { value: "MISC", label: "Khác" }
] as const;

export default function ExpensesPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [list, setList] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { values: persisted, setParam } = usePersistedParams({
    q: { type: "string", default: "" },
    limit: { type: "number", default: 10 },
    projectIdFilter: { type: "string", default: "" },
    categoryFilter: { type: "string", default: "" },
    startDate: { type: "string", default: "" },
    endDate: { type: "string", default: "" }
  });
  const [searchTerm, setSearchTerm] = useState(persisted.q);
  const [itemsPerPage, setItemsPerPage] = useState(persisted.limit);
  const [filterProjectId, setFilterProjectId] = useState<string>(persisted.projectIdFilter);
  const [filterCategory, setFilterCategory] = useState<string>(persisted.categoryFilter);
  const [startDateFilter, setStartDateFilter] = useState<string>(persisted.startDate);
  const [endDateFilter, setEndDateFilter] = useState<string>(persisted.endDate);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; id?: string }>({ open: false });

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [projectId, setProjectId] = useState<string>("");
  const [amountVnd, setAmountVnd] = useState<number>(0);
  const [category, setCategory] = useState<string>("MISC");
  const [description, setDescription] = useState<string>("");

  type ExpenseForm = { date: string; projectId: string; amountVnd: string; category: string; description: string };
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ExpenseForm>({
    defaultValues: { date: new Date().toISOString().slice(0,10), projectId: "", amountVnd: "0", category: "MISC", description: "" }
  });

  async function refresh(pageParam: number = 1, limitParam: number = itemsPerPage) {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(pageParam),
        limit: String(limitParam),
        projectId: filterProjectId || "",
        category: filterCategory || "",
        startDate: startDateFilter || "",
        endDate: endDateFilter || ""
      });
      const [e, p] = await Promise.all([
        authenticatedFetch(`/api/expenses?${query.toString()}`, { cache: "no-store" }).then(async res => {
          if (!res.ok) {
            if (res.status === 401) { window.location.href = '/auth/login'; return { items: [], total: 0 }; }
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
      setList(e.items || e);
      if (typeof e.total === 'number') setTotalCount(e.total);
      setProjects(p);
      if (!projectId && p[0]) setProjectId(p[0].id);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setToast({ message: "Có lỗi xảy ra khi tải dữ liệu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // Filter expenses based on search + advanced filters
  const filteredExpenses = list.filter(expense => {
    const categoryLabel = CATEGORIES.find(c => c.value === expense.category)?.label || expense.category;
    const searchLower = searchTerm.toLowerCase();
    const inSearch = (
      categoryLabel.toLowerCase().includes(searchLower) ||
      expense.description?.toLowerCase().includes(searchLower) ||
      new Date(expense.date).toLocaleDateString('vi-VN').includes(searchLower)
    );
    const inProject = !filterProjectId || expense.projectId === filterProjectId;
    const inCategory = !filterCategory || expense.category === filterCategory;
    const d = expense.date.slice(0,10);
    const afterStart = !startDateFilter || d >= startDateFilter;
    const beforeEnd = !endDateFilter || d <= endDateFilter;
    return inSearch && inProject && inCategory && afterStart && beforeEnd;
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredExpenses, itemsPerPage, searchTerm ? undefined : totalCount);

  useEffect(() => {
    // Server fetch for page/limit/filters (search term vẫn lọc client)
    refresh(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, filterProjectId, filterCategory, startDateFilter, endDateFilter]);

  // Reset to first page when filters change and persist to URL
  useEffect(() => {
    setParam("q", searchTerm);
    setParam("limit", itemsPerPage);
    setParam("projectIdFilter", filterProjectId || "");
    setParam("categoryFilter", filterCategory || "");
    setParam("startDate", startDateFilter || "");
    setParam("endDate", endDateFilter || "");
    resetPage();
  }, [searchTerm, itemsPerPage, filterProjectId, filterCategory, startDateFilter, endDateFilter]);

  async function createExpense(data: ExpenseForm) {
    const selected = projects.find(p=>p.id===data.projectId);
    if (selected?.isCompleted) {
      setToast({ message: "Công trình đã hoàn thành. Không thể thêm chi phí mới.", type: "error" });
      return;
    }
    try {
      await authenticatedFetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(data.date + "T00:00:00.000Z"),
          projectId: data.projectId,
          category: data.category,
          amountVnd: Number(String(data.amountVnd).replace(/\D/g, "")),
          description: data.description ? data.description : null,
        }),
      });
      resetForm();
      await refresh();
      setToast({ message: "Thêm chi phí thành công!", type: "success" });
    } catch (error) {
      console.error('Error creating expense:', error);
      setToast({ message: "Có lỗi xảy ra khi thêm chi phí", type: "error" });
    }
  }

  async function updateExpense(data: ExpenseForm) {
    if (!editingExpense) return;
    const selected = projects.find(p=>p.id===data.projectId);
    if (selected?.isCompleted) {
      setToast({ message: "Công trình đã hoàn thành. Không thể cập nhật chi phí.", type: "error" });
      return;
    }
    
    try {
      await authenticatedFetch("/api/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingExpense.id,
          date: new Date(data.date + "T00:00:00.000Z"),
          projectId: data.projectId,
          category: data.category,
          amountVnd: Number(String(data.amountVnd).replace(/\D/g, "")),
          description: data.description ? data.description : null,
        }),
      });
      resetForm();
      await refresh();
      setToast({ message: "Cập nhật chi phí thành công!", type: "success" });
    } catch (error) {
      console.error('Error updating expense:', error);
      setToast({ message: "Có lỗi xảy ra khi cập nhật chi phí", type: "error" });
    }
  }

  async function deleteExpense(id: string) {
    setConfirmState({ open: true, id });
  }

  async function doDeleteExpense(id: string) {
    try {
      await authenticatedFetch(`/api/expenses?id=${id}`, {
        method: "DELETE",
      });
      await refresh();
      setToast({ message: "Xóa chi phí thành công!", type: "success" });
    } catch (error) {
      console.error('Error deleting expense:', error);
      setToast({ message: "Có lỗi xảy ra khi xóa chi phí", type: "error" });
    }
  }

  function resetForm() {
    reset({ date: new Date().toISOString().slice(0,10), projectId: "", amountVnd: "0", category: "MISC", description: "" });
    setShowAddForm(false);
    setEditingExpense(null);
  }

  function startEdit(expense: Expense) {
    setEditingExpense(expense);
    reset({
      date: expense.date.slice(0,10),
      projectId: expense.projectId,
      amountVnd: String(expense.amountVnd),
      category: expense.category,
      description: expense.description || ""
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
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 mx-auto max-w-2xl md:max-w-3xl">
      <PageHeader title="Chi tiền" />
      <div className="p-4">

        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <DebouncedInput
            value={searchTerm}
            onDebouncedChange={setSearchTerm}
            placeholder="Tìm kiếm theo loại chi phí, mô tả hoặc ngày..."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ModernSelect value={filterProjectId} onChange={e=>setFilterProjectId(e.target.value)}>
              <option value="">Tất cả dự án</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </ModernSelect>
            <ModernSelect value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
              <option value="">Tất cả loại</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </ModernSelect>
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
          <ModernForm onSubmit={handleSubmit(editingExpense ? updateExpense : createExpense)} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingExpense ? "Sửa chi phí" : "Thêm chi phí mới"}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí</label>
              <RHFSelect control={control} name="category" rules={{ required: true }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </RHFSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
              <RHFInput 
                control={control} 
                name="amountVnd" 
                rules={{ required: true, min: 0 }} 
                type="text" 
                inputMode="numeric"
                placeholder="Ví dụ: 500.000" 
                onChange={(e: any) => {
                  const digits = String(e.target.value || '').replace(/\D/g, '');
                  e.target.value = new Intl.NumberFormat('vi-VN').format(Number(digits || 0));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <RHFInput control={control} name="description" placeholder="Mô tả chi phí (tuỳ chọn)" />
            </div>
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1" disabled={isSubmitting}>
                {editingExpense ? "Cập nhật" : "Thêm chi phí"}
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
        {!loading && filteredExpenses.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredExpenses.length)} trong {filteredExpenses.length} chi phí
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">Đang tải...</div>
            </ModernCard>
          ) : filteredExpenses.length === 0 ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm ? "Không tìm thấy chi phí nào" : "Chưa có chi phí nào"}
              </div>
            </ModernCard>
          ) : (
            paginatedItems.map(e => {
              const categoryLabel = CATEGORIES.find(c => c.value === e.category)?.label || e.category;
              const projectName = projects.find(p => p.id === e.projectId)?.name || "Không xác định";
              
              return (
                <ModernListItem key={e.id} className="hover:scale-105">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900 mb-1">
                        {formatVnd(e.amountVnd)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                          {categoryLabel}
                        </span>
                        {new Date(e.date).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        📁 {projectName}
                      </div>
                      {e.description && (
                        <div className="text-sm text-gray-500">
                          {e.description}
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => startEdit(e)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteExpense(e.id)}
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
        title="Xóa chi phí"
        message="Bạn có chắc chắn muốn xóa chi phí này?"
        confirmText="Xóa"
        cancelText="Hủy"
        onCancel={() => { setConfirmState({ open: false }); setToast({ message: 'Đã hủy thao tác', type: 'info' }); }}
        onConfirm={() => { const id = confirmState.id!; setConfirmState({ open: false }); doDeleteExpense(id); }}
      />
    </div>
  );
}

