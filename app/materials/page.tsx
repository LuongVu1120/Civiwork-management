"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem, DebouncedInput, ModernAutocomplete } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { usePersistedParams } from "@/app/hooks/usePersistedParams";
import { ConfirmDialog } from "@/app/lib/modern-components";
import { Toast } from "@/app/lib/validation";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";

type Material = { 
  id: string; 
  date: string; 
  itemName: string; 
  quantity?: number; 
  unit?: string | null;
  quantityText?: string;
  unitPriceVnd: number; 
  totalVnd: number; 
  supplier?: string | null;
  project?: { id: string; name: string };
};
type Project = { id: string; name: string; isCompleted?: boolean };

export default function MaterialsPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [list, setList] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; id?: string }>({ open: false });

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [projectId, setProjectId] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("0");
  const [unitPriceVnd, setUnitPriceVnd] = useState<string>("0");
  const [supplier, setSupplier] = useState<string>("");

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
      const [m, p] = await Promise.all([
        authenticatedFetch(`/api/materials?${query.toString()}`, { cache: "no-store" }).then(async res => {
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
      setList(m.items || m);
      if (typeof m.total === 'number') setTotalCount(m.total);
      setProjects(p);
      if (!projectId && p[0]) setProjectId(p[0].id);
    } catch (error) {
      console.error('Error loading materials:', error);
      setToast({ message: "Có lỗi xảy ra khi tải dữ liệu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // Filter materials based on search + advanced filters
  const filteredMaterials = list.filter(material => {
    const searchLower = searchTerm.toLowerCase();
    const inSearch = (
      material.itemName.toLowerCase().includes(searchLower) ||
      (material.supplier && material.supplier.toLowerCase().includes(searchLower)) ||
      (material.project && material.project.name.toLowerCase().includes(searchLower))
    );
    const inProject = !filterProjectId || material.project?.id === filterProjectId;
    const d = material.date.slice(0,10);
    const afterStart = !startDateFilter || d >= startDateFilter;
    const beforeEnd = !endDateFilter || d <= endDateFilter;
    return inSearch && inProject && afterStart && beforeEnd;
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredMaterials, itemsPerPage, searchTerm ? undefined : totalCount);

  useEffect(() => {
    refresh(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, filterProjectId, startDateFilter, endDateFilter]);

  // Reset to first page when filters change and persist to URL
  useEffect(() => {
    setParam("q", searchTerm);
    setParam("limit", itemsPerPage);
    setParam("projectIdFilter", filterProjectId || "");
    setParam("startDate", startDateFilter || "");
    setParam("endDate", endDateFilter || "");
    resetPage();
  }, [searchTerm, itemsPerPage, filterProjectId, startDateFilter, endDateFilter]);

  async function createMaterial(e: React.FormEvent) {
    e.preventDefault();
    try {
      const selected = projects.find(p=>p.id===projectId);
      if (selected?.isCompleted) {
      setToast({ message: "Công trình đã hoàn thành. Không thể thêm vật tư mới.", type: "error" });
        return;
      }
      const parsedUnitPrice = Number(String(unitPriceVnd).replace(/\D/g, "")) || 0;
      const quantityMatch = String(quantity).match(/^\s*([\d.,]+)\s*(.*)$/);
      const rawQty = quantityMatch ? quantityMatch[1] : String(quantity);
      const unitLabel = quantityMatch ? (quantityMatch[2] || '').trim() : '';
      const normalizedQty = rawQty.replace(/,/g, '.').replace(/[^0-9.]/g, '');
      const parts = normalizedQty.split('.');
      const parsedQuantity = parts.length > 2 
        ? Number(parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]) 
        : Number(normalizedQty || '0');
      const totalVnd = parsedUnitPrice; // giá tổng cho toàn bộ số lượng
      await authenticatedFetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(date + "T00:00:00.000Z"),
          projectId,
          itemName,
          quantity: parsedQuantity,
          unit: unitLabel || null,
          quantityText: rawQty,
          unitPriceVnd: parsedUnitPrice,
          totalVnd,
          supplier: supplier || null,
        }),
      });
      setItemName("");
      setQuantity("0");
      setUnitPriceVnd("0");
      setSupplier("");
      setShowAddForm(false);
      await refresh();
      setToast({ message: "Thêm vật liệu thành công!", type: "success" });
    } catch (error) {
      console.error('Error creating material:', error);
      setToast({ message: "Có lỗi xảy ra khi thêm vật liệu", type: "error" });
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 mx-auto max-w-2xl md:max-w-3xl">
      <PageHeader title="Vật tư" />
      <div className="p-4">
        
        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <DebouncedInput
            value={searchTerm}
            onDebouncedChange={setSearchTerm}
            placeholder="Tìm kiếm theo tên vật tư, nhà cung cấp..."
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

        {/* Add Form */}
        {showAddForm && (
          <ModernForm onSubmit={createMaterial} className="mb-6">
            <ModernInput 
              type="date" 
              value={date} 
              onChange={e=>setDate(e.target.value)} 
            />
            <ModernAutocomplete
              options={(showCompletedProjects ? projects : projects.filter(p=>!p.isCompleted)).map(p=>({ id: p.id, label: p.name + (p.isCompleted ? " (đã hoàn thành)" : "") }))}
              value={projectId}
              onChange={setProjectId}
              placeholder="Chọn dự án..."
            />
            <ModernInput 
              value={itemName} 
              onChange={e=>setItemName(e.target.value)} 
              placeholder="Tên vật tư"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <ModernInput 
                  type="text" 
                  value={quantity}
                  onChange={e=>setQuantity(e.target.value)} 
                  placeholder="Ví dụ: 10 tấn hoặc 12.5 m3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá tổng (VND)</label>
                <ModernInput 
                  type="text" 
                  value={unitPriceVnd}
                  onChange={e=>{
                    const digits = e.target.value.replace(/\D/g, "");
                    const formatted = new Intl.NumberFormat('vi-VN').format(Number(digits || 0));
                    setUnitPriceVnd(formatted);
                  }} 
                  placeholder="Ví dụ: 12.000.000"
                />
              </div>
            </div>
            <ModernInput 
              value={supplier} 
              onChange={e=>setSupplier(e.target.value)} 
              placeholder="Nhà cung cấp (tuỳ chọn)" 
            />
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                Thêm vật tư
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
        {!loading && filteredMaterials.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredMaterials.length)} trong {filteredMaterials.length} vật tư
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">Đang tải...</div>
            </ModernCard>
          ) : filteredMaterials.length === 0 ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm ? "Không tìm thấy vật tư nào" : "Chưa có vật tư nào"}
              </div>
            </ModernCard>
          ) : (
            paginatedItems.map(m => (
              <ModernListItem key={m.id} className="hover:scale-105">
                <div className="font-semibold text-lg text-gray-900 mb-1">
                  {m.itemName}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {new Date(m.date).toLocaleDateString('vi-VN')}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Số lượng:</span>
                    <span className="font-medium">{m.quantityText ? `${m.quantityText}${m.unit ? ` ${m.unit}` : ''}` : (m.unit ? `${m.quantity} ${m.unit}` : String(m.quantity))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đơn giá:</span>
                    <span className="font-medium">{formatVnd(m.unitPriceVnd)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-orange-600">
                    <span>Tổng tiền:</span>
                    <span>{formatVnd(m.totalVnd)}</span>
                  </div>
                  {m.supplier && (
                    <div className="text-xs text-gray-500">
                      Nhà cung cấp: {m.supplier}
                    </div>
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
      <ConfirmDialog
        open={confirmState.open}
        title="Xóa vật tư"
        message="Bạn có chắc chắn muốn xóa vật tư này?"
        confirmText="Xóa"
        cancelText="Hủy"
        onCancel={() => { setConfirmState({ open: false }); setToast({ message: 'Đã hủy thao tác', type: 'info' }); }}
        onConfirm={() => { /* Hiện tại màn vật tư chưa có nút xóa từng dòng; dialog này để sẵn dùng khi bổ sung */ setConfirmState({ open: false }); }}
      />
    </div>
  );
}