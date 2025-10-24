"use client";
import { useEffect, useMemo, useState } from "react";
import { useFormValidation, validationRules, ErrorMessage, LoadingSpinner, Toast } from "@/app/lib/validation";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<Worker["role"] | "ALL">("ALL");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10); // 10 items per page for mobile

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

  // Reset to first page when filters or items per page change
  useEffect(() => {
    resetPage();
  }, [searchTerm, filterRole, itemsPerPage]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-md">
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
          <div className="grid grid-cols-2 gap-3">
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

        {/* Add Form */}
        {showAddForm && (
          <ModernForm onSubmit={createWorker} className="mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên <span className="text-red-500">*</span>
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
                  type="number"
                  value={dailyRateVnd}
                  onChange={e=>setDailyRateVnd(Number(e.target.value))}
                  placeholder="Ví dụ: 500000"
                  error={!!getError('dailyRateVnd')}
                  min={0}
                  max={10000000}
                  step={1000}
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
                  type="number"
                  value={monthlyAllowanceVnd}
                  onChange={e=>setMonthlyAllowanceVnd(Number(e.target.value))}
                  placeholder="Ví dụ: 1500000"
                  error={!!getError('monthlyAllowanceVnd')}
                  min={0}
                  max={50000000}
                  step={100000}
                />
                <ErrorMessage error={getError('monthlyAllowanceVnd')} />
                <div className="text-xs text-gray-500 mt-1">
                  {selectedRole.defaultAllowance > 0 ? `Mặc định: ${selectedRole.defaultAllowance.toLocaleString()}đ` : 'Không có phụ cấp'}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                Thêm nhân sự
              </ModernButton>
              <ModernButton 
                type="button" 
                variant="secondary"
                onClick={() => setShowAddForm(false)}
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
    </div>
  );
}


