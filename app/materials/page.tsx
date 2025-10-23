"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { Toast } from "@/app/lib/validation";

type Material = { 
  id: string; 
  date: string; 
  itemName: string; 
  quantity: number; 
  unitPriceVnd: number; 
  totalVnd: number; 
  supplier?: string | null;
  project?: { id: string; name: string };
};
type Project = { id: string; name: string };

export default function MaterialsPage() {
  const [list, setList] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [projectId, setProjectId] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPriceVnd, setUnitPriceVnd] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        fetch("/api/materials", { 
          cache: "no-store",
          credentials: "include"
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
        fetch("/api/projects", { 
          cache: "no-store",
          credentials: "include"
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
      setList(m);
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

  // Filter materials based on search
  const filteredMaterials = list.filter(material => 
    material.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (material.project && material.project.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredMaterials, itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    resetPage();
  }, [searchTerm, itemsPerPage]);

  async function createMaterial(e: React.FormEvent) {
    e.preventDefault();
    try {
      const totalVnd = quantity * unitPriceVnd;
      await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: new Date(date + "T00:00:00.000Z"),
          projectId,
          itemName,
          quantity,
          unitPriceVnd,
          totalVnd,
          supplier: supplier || null,
        }),
      });
      setItemName("");
      setQuantity(0);
      setUnitPriceVnd(0);
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
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-orange-50 to-red-50 mx-auto max-w-md">
      <PageHeader title="Vật tư" />
      <div className="p-4">
        
        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <ModernInput
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên vật tư, nhà cung cấp..."
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

        {/* Add Form */}
        {showAddForm && (
          <ModernForm onSubmit={createMaterial} className="mb-6">
            <ModernInput 
              type="date" 
              value={date} 
              onChange={e=>setDate(e.target.value)} 
            />
            <ModernSelect value={projectId} onChange={e=>setProjectId(e.target.value)}>
              <option value="">Chọn dự án...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </ModernSelect>
            <ModernInput 
              value={itemName} 
              onChange={e=>setItemName(e.target.value)} 
              placeholder="Tên vật tư"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <ModernInput 
                type="number" 
                value={quantity} 
                onChange={e=>setQuantity(Number(e.target.value))} 
                placeholder="Số lượng"
                min={0}
                step={0.01}
              />
              <ModernInput 
                type="number" 
                value={unitPriceVnd} 
                onChange={e=>setUnitPriceVnd(Number(e.target.value))} 
                placeholder="Đơn giá (VND)"
                min={0}
                step={1000}
              />
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
                    <span className="font-medium">{m.quantity}</span>
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
    </div>
  );
}