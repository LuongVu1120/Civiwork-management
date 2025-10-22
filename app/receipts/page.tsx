"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernSelect, ModernForm, ModernListItem } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";

type Receipt = { id: string; date: string; amountVnd: number; description?: string | null };
type Project = { id: string; name: string };

export default function ReceiptsPage() {
  const [list, setList] = useState<Receipt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [projectId, setProjectId] = useState<string>("");
  const [amountVnd, setAmountVnd] = useState<number>(0);
  const [description, setDescription] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        fetch("/api/receipts", { cache: "no-store" }).then(res=>res.json()),
        fetch("/api/projects", { cache: "no-store" }).then(res=>res.json()),
      ]);
      setList(r);
      setProjects(p);
      if (!projectId && p[0]) setProjectId(p[0].id);
    } catch (error) {
      console.error('Error loading receipts:', error);
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
      await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(date + "T00:00:00.000Z"),
          projectId,
          amountVnd,
          description: description || null,
        }),
      });
      setAmountVnd(0);
      setDescription("");
      setShowAddForm(false);
      await refresh();
    } catch (error) {
      console.error('Error creating receipt:', error);
    }
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

        {/* Add Form */}
        {showAddForm && (
          <ModernForm onSubmit={createReceipt} className="mb-6">
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
              type="number" 
              value={amountVnd} 
              onChange={e=>setAmountVnd(Number(e.target.value))} 
              placeholder="Số tiền (VND)"
              min={0}
              step={1000}
            />
            <ModernInput 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
              placeholder="Mô tả (tuỳ chọn)" 
            />
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                Thêm thu tiền
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
            paginatedItems.map(r => (
              <ModernListItem key={r.id} className="hover:scale-105">
                <div className="font-semibold text-lg text-gray-900 mb-1">
                  {formatVnd(r.amountVnd)}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {new Date(r.date).toLocaleDateString('vi-VN')}
                </div>
                {r.description && (
                  <div className="text-sm text-gray-500">
                    {r.description}
                  </div>
                )}
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
    </div>
  );
}