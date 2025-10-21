"use client";
import { useEffect, useMemo, useState } from "react";
import { useFormValidation, validationRules, ErrorMessage, LoadingSpinner, Toast } from "@/app/lib/validation";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";

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
  const [list, setList] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<Worker["role"] | "ALL">("ALL");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
    const res = await fetch("/api/workers", { cache: "no-store" });
    const data = await res.json();
    setList(data);
    setLoading(false);
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
      const response = await fetch("/api/workers", {
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
          <ModernSelect
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as Worker["role"] | "ALL")}
          >
            <option value="ALL">Tất cả vai trò</option>
            {ROLE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </ModernSelect>
        </ModernCard>

        {/* Add Form */}
        {showAddForm && (
          <ModernForm onSubmit={createWorker} className="mb-6">
            <ModernInput
              value={fullName}
              onChange={e=>setFullName(e.target.value)}
              placeholder="Họ tên"
              error={!!getError('fullName')}
              required
            />
            <ErrorMessage error={getError('fullName')} />

            <ModernSelect value={role} onChange={e=>setRole(e.target.value as Worker["role"])}>
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </ModernSelect>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <ModernInput
                  type="number"
                  value={dailyRateVnd}
                  onChange={e=>setDailyRateVnd(Number(e.target.value))}
                  placeholder="Lương/ngày (VND)"
                  error={!!getError('dailyRateVnd')}
                />
                <ErrorMessage error={getError('dailyRateVnd')} />
              </div>
              <div>
                <ModernInput
                  type="number"
                  value={monthlyAllowanceVnd}
                  onChange={e=>setMonthlyAllowanceVnd(Number(e.target.value))}
                  placeholder="Phụ cấp/tháng (VND)"
                  error={!!getError('monthlyAllowanceVnd')}
                />
                <ErrorMessage error={getError('monthlyAllowanceVnd')} />
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

        <div className="space-y-3">
          {loading ? (
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
            filteredWorkers.map(w => (
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
      </div>

      <FloatingActionButton onClick={() => setShowAddForm(true)}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </FloatingActionButton>
    </div>
  );
}


