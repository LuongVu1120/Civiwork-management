"use client";
import { useEffect, useMemo, useState } from "react";
import { useFormValidation, validationRules, ErrorMessage, LoadingSpinner, Toast } from "@/app/lib/validation";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem, ConfirmDialog } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { usePersistedParams } from "@/app/hooks/usePersistedParams";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";

type Worker = {
  id: string;
  fullName: string;
  role: "DOI_TRUONG" | "THO_XAY" | "THO_PHU" | "THUE_NGOAI";
  dailyRateVnd: number;
  monthlyAllowanceVnd: number;
};

const ROLE_OPTIONS: Array<{ value: Worker["role"]; label: string; defaultRate: number; defaultAllowance: number }> = [
  { value: "DOI_TRUONG", label: "Đội trưởng", defaultRate: 500000, defaultAllowance: 1500000 },
  { value: "THO_XAY", label: "Thợ xây", defaultRate: 420000, defaultAllowance: 0 },
  { value: "THO_PHU", label: "Thợ phụ", defaultRate: 320000, defaultAllowance: 0 },
  { value: "THUE_NGOAI", label: "Thuê ngoài", defaultRate: 0, defaultAllowance: 0 },
];

export default function WorkersPage() {
  const { loading: authLoading } = useAuthGuard();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [list, setList] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { values: persisted, setParam } = usePersistedParams({
    q: { type: "string", default: "" },
    role: { type: "string", default: "ALL" },
    limit: { type: "number", default: 10 }
  });
  const [searchTerm, setSearchTerm] = useState(persisted.q);
  const [filterRole, setFilterRole] = useState<Worker["role"] | "ALL">(persisted.role as any);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; id?: string }>({ open: false });
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(persisted.limit); // 10 items per page for mobile

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Worker["role"]>("THO_XAY");
  const selectedRole = useMemo(() => ROLE_OPTIONS.find(r => r.value === role)!, [role]);
  const [dailyRateVnd, setDailyRateVnd] = useState<number>(selectedRole.defaultRate);
  const [monthlyAllowanceVnd, setMonthlyAllowanceVnd] = useState<number>(selectedRole.defaultAllowance);

  const { validate, getError, clearErrors } = useFormValidation();

  useEffect(() => {
    setDailyRateVnd(selectedRole.defaultRate);
    setMonthlyAllowanceVnd(selectedRole.defaultAllowance);
  }, [selectedRole]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/workers", { 
        cache: "no-store"
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/auth/login';
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setList(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setToast({ 
        message: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải dữ liệu", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createWorker(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    
    const isValid = validate(
      { fullName, dailyRateVnd, monthlyAllowanceVnd },
      {
        fullName: validationRules.required("Họ tên"),
        dailyRateVnd: validationRules.minValue(0, "Lương ngày"),
        monthlyAllowanceVnd: validationRules.minValue(0, "Phụ cấp tháng")
      }
    );
    
    if (!isValid) return;
    
    try {
      const response = await authenticatedFetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, role, dailyRateVnd, monthlyAllowanceVnd }),
      });
      
      if (!response.ok) {
        throw new Error("Có lỗi xảy ra khi thêm nhân sự");
      }
      
      setFullName("");
      setShowAddForm(false);
      setToast({ message: "Thêm nhân sự thành công!", type: "success" });
      await refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Có lỗi xảy ra", type: "error" });
    }
  }

  async function updateWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWorker) return;
    clearErrors();
    const isValid = validate(
      { fullName, dailyRateVnd, monthlyAllowanceVnd },
      {
        fullName: validationRules.required("Họ tên"),
        dailyRateVnd: validationRules.minValue(0, "Lương ngày"),
        monthlyAllowanceVnd: validationRules.minValue(0, "Phụ cấp tháng")
      }
    );
    if (!isValid) return;

    try {
      const response = await authenticatedFetch("/api/workers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingWorker.id,
          fullName,
          role,
          dailyRateVnd,
          monthlyAllowanceVnd
        })
      });
      if (!response.ok) throw new Error("Có lỗi xảy ra khi cập nhật nhân sự");
      setToast({ message: "Cập nhật nhân sự thành công!", type: "success" });
      resetForm();
      await refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Có lỗi xảy ra", type: "error" });
    }
  }

  function startEdit(w: Worker) {
    setEditingWorker(w);
    setFullName(w.fullName);
    setRole(w.role);
    setDailyRateVnd(w.dailyRateVnd);
    setMonthlyAllowanceVnd(w.monthlyAllowanceVnd);
    setShowAddForm(true);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function resetForm() {
    setFullName("");
    setRole("THO_XAY");
    setDailyRateVnd(ROLE_OPTIONS.find(r=>r.value==="THO_XAY")!.defaultRate);
    setMonthlyAllowanceVnd(ROLE_OPTIONS.find(r=>r.value==="THO_XAY")!.defaultAllowance);
    setEditingWorker(null);
    setShowAddForm(false);
  }

  function confirmDelete(id: string) {
    setConfirmState({ open: true, id });
  }

  async function doDelete(id: string) {
    try {
      const res = await authenticatedFetch(`/api/workers?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xóa nhân sự");
      setToast({ message: "Xóa nhân sự thành công!", type: "success" });
      await refresh();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Có lỗi xảy ra", type: "error" });
    }
  }

  // Filter workers based on search and role filter
  const filteredWorkers = useMemo(() => {
    return list.filter(worker => {
      const matchesSearch = worker.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "ALL" || worker.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [list, searchTerm, filterRole]);

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredWorkers, itemsPerPage);

  // Reset to first page when filters or items per page change and persist to URL
  useEffect(() => {
    setParam("q", searchTerm);
    setParam("role", filterRole);
    setParam("limit", itemsPerPage);
    resetPage();
  }, [searchTerm, filterRole, itemsPerPage]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-2xl md:max-w-3xl">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader title="Nhân sự" />

      <div className="p-4">
        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <ModernInput
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên..."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ModernSelect
              value={filterRole}
              onChange={e => setFilterRole(e.target.value as Worker["role"] | "ALL")}
            >
              <option value="ALL">Tất cả vai trò</option>
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
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
          <ModernForm onSubmit={editingWorker ? updateWorker : createWorker} className="mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingWorker ? "Sửa họ tên" : "Họ tên"} <span className="text-red-500">*</span>
              </label>
              <ModernInput
                value={fullName}
                onChange={e=>setFullName(e.target.value)}
                placeholder="Nhập họ tên đầy đủ"
                error={!!getError('fullName')}
                required
              />
              <ErrorMessage error={getError('fullName')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò
              </label>
              <ModernSelect value={role} onChange={e=>setRole(e.target.value as Worker["role"])}>
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </ModernSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lương/ngày (VND)
                </label>
                <ModernInput
                  type="text"
                  value={new Intl.NumberFormat('vi-VN').format(Number(dailyRateVnd || 0))}
                  onChange={e=>{
                    const digits = e.target.value.replace(/\D/g, '');
                    setDailyRateVnd(Number(digits || 0));
                  }}
                  placeholder="Ví dụ: 500.000"
                  error={!!getError('dailyRateVnd')}
                />
                <ErrorMessage error={getError('dailyRateVnd')} />
                <div className="text-xs text-gray-500 mt-1">
                  {selectedRole.label}: {selectedRole.defaultRate.toLocaleString()}đ
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phụ cấp/tháng (VND)
                </label>
                <ModernInput
                  type="text"
                  value={new Intl.NumberFormat('vi-VN').format(Number(monthlyAllowanceVnd || 0))}
                  onChange={e=>{
                    const digits = e.target.value.replace(/\D/g, '');
                    setMonthlyAllowanceVnd(Number(digits || 0));
                  }}
                  placeholder="Ví dụ: 1.500.000"
                  error={!!getError('monthlyAllowanceVnd')}
                />
                <ErrorMessage error={getError('monthlyAllowanceVnd')} />
                <div className="text-xs text-gray-500 mt-1">
                  {selectedRole.defaultAllowance > 0 ? `Mặc định: ${selectedRole.defaultAllowance.toLocaleString()}đ` : 'Không có phụ cấp'}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                {editingWorker ? "Cập nhật nhân sự" : "Thêm nhân sự"}
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
        {!loading && filteredWorkers.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredWorkers.length)} trong {filteredWorkers.length} nhân sự
          </div>
        )}

        <div className="space-y-3">
          {authLoading || loading ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500 flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Đang tải…</span>
              </div>
            </ModernCard>
          ) : filteredWorkers.length === 0 ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm || filterRole !== "ALL" ? "Không tìm thấy nhân sự nào" : "Chưa có nhân sự nào"}
              </div>
            </ModernCard>
          ) : (
            paginatedItems.map(w => (
              <ModernListItem key={w.id} className="hover:scale-105">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <div className="font-semibold text-lg text-gray-900 mb-1">{w.fullName}</div>
                    <div className="text-sm text-gray-600">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        {ROLE_OPTIONS.find(r => r.value === w.role)?.label}
                      </span>
                      <span className="text-gray-500">
                        {w.dailyRateVnd.toLocaleString()}đ/ngày
                      </span>
                      {w.monthlyAllowanceVnd > 0 && (
                        <span className="text-gray-500 ml-2">
                          · Phụ cấp {w.monthlyAllowanceVnd.toLocaleString()}đ/tháng
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => startEdit(w)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors w-full sm:w-auto"
                      title="Sửa nhân sự"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => confirmDelete(w.id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors w-full sm:w-auto"
                      title="Xóa nhân sự"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Xóa</span>
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

      <FloatingActionButton onClick={() => setShowAddForm(true)}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </FloatingActionButton>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmDialog
        open={confirmState.open}
        title="Xóa nhân sự"
        message="Bạn có chắc chắn muốn xóa nhân sự này?"
        confirmText="Xóa"
        cancelText="Hủy"
        onCancel={() => setConfirmState({ open: false })}
        onConfirm={() => { const id = confirmState.id!; setConfirmState({ open: false }); doDelete(id); }}
      />
    </div>
  );
}


