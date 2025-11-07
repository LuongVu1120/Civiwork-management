"use client";
import { useEffect, useState } from "react";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernForm, ModernListItem, ModernSelect, DebouncedInput, ModernAutocomplete, ConfirmDialog } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";
import { usePersistedParams } from "@/app/hooks/usePersistedParams";
import { Toast } from "@/app/lib/validation";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";
import { formatVnd } from "@/app/lib/format";

type ExternalHire = { id: string; projectId: string; title: string; description?: string | null; startDate: string; endDate: string; amountVnd: number; project?: { id: string; name: string } };
type Project = { id: string; name: string; isCompleted?: boolean };

export default function ExternalHiresPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [list, setList] = useState<ExternalHire[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
  const [editing, setEditing] = useState<ExternalHire | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; id?: string }>({ open: false });
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);

  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [amountVnd, setAmountVnd] = useState<string>("0");

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
      const [r, pRaw] = await Promise.all([
        authenticatedFetch(`/api/external-hires?${query.toString()}`, { cache: "no-store" }).then(async res => {
          if (!res.ok) {
            if (res.status === 401) { window.location.href = '/auth/login'; return { items: [], total: 0 }; }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        }),
        authenticatedFetch("/api/projects", { cache: "no-store" }).then(async res => {
          if (!res.ok) { if (res.status === 401) { window.location.href = '/auth/login'; return []; } throw new Error(`HTTP ${res.status}: ${res.statusText}`); }
          const data = await res.json();
          return Array.isArray(data) ? data : data.items || [];
        })
      ]);
      setList(r.items || r);
      if (typeof r.total === 'number') setTotalCount(r.total);
      setProjects(pRaw);
      if (!projectId && pRaw[0]) setProjectId(pRaw[0].id);
    } catch (e) {
      console.error('Error loading external hires:', e);
      setToast({ message: 'Có lỗi xảy ra khi tải dữ liệu', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = list.filter(item => {
    const s = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(s) ||
      (item.project?.name || '').toLowerCase().includes(s) ||
      (item.description || '').toLowerCase().includes(s)
    );
  });

  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } =
    usePagination(filtered, itemsPerPage, searchTerm ? undefined : totalCount);

  useEffect(() => { refresh(currentPage, itemsPerPage); }, [currentPage, itemsPerPage, filterProjectId, startDateFilter, endDateFilter]);
  useEffect(() => { setParam('q', searchTerm); setParam('limit', itemsPerPage); setParam('projectIdFilter', filterProjectId || ''); setParam('startDate', startDateFilter || ''); setParam('endDate', endDateFilter || ''); resetPage(); }, [searchTerm, itemsPerPage, filterProjectId, startDateFilter, endDateFilter]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selected = projects.find(p => p.id === projectId);
    if (selected?.isCompleted) {
      setToast({ message: "Công trình đã hoàn thành. Không thể thêm/cập nhật thuê ngoài.", type: "error" });
      return;
    }
    try {
      const payload = {
        projectId,
        title,
        description: description || null,
        startDate: new Date(startDate + 'T00:00:00.000Z'),
        endDate: new Date(endDate + 'T00:00:00.000Z'),
        amountVnd: Number(String(amountVnd).replace(/\D/g, ''))
      } as any;
      await authenticatedFetch('/api/external-hires', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload)
      });
      resetForm();
      await refresh();
      setToast({ message: editing ? 'Cập nhật thuê ngoài thành công!' : 'Thêm thuê ngoài thành công!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Có lỗi xảy ra', type: 'error' });
    }
  }

  function startEdit(item: ExternalHire) {
    setEditing(item);
    setProjectId(item.projectId);
    setTitle(item.title);
    setDescription(item.description || '');
    setStartDate(item.startDate.slice(0,10));
    setEndDate(item.endDate.slice(0,10));
    setAmountVnd(new Intl.NumberFormat('vi-VN').format(item.amountVnd));
    setShowAddForm(true);
    setTimeout(() => { const form = document.querySelector('form'); if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  }

  function resetForm() {
    setEditing(null);
    setTitle('');
    setDescription('');
    setStartDate(new Date().toISOString().slice(0,10));
    setEndDate(new Date().toISOString().slice(0,10));
    setAmountVnd('0');
    setShowAddForm(false);
  }

  function confirmDelete(id: string) { setConfirmState({ open: true, id }); }
  async function doDelete(id: string) {
    try { await authenticatedFetch(`/api/external-hires?id=${id}`, { method: 'DELETE' }); await refresh(); setToast({ message: 'Đã xóa thuê ngoài', type: 'success' }); } 
    catch { setToast({ message: 'Không thể xóa', type: 'error' }); }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-amber-50 to-yellow-50 mx-auto max-w-2xl md:max-w-3xl">
      <PageHeader title="Thuê ngoài" />
      <div className="p-4">

        <ModernCard className="mb-6 space-y-3">
          <DebouncedInput value={searchTerm} onDebouncedChange={setSearchTerm} placeholder="Tìm theo tiêu đề, công trình..." />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ModernAutocomplete options={projects.map(p=>({ id: p.id, label: p.name }))} value={filterProjectId} onChange={setFilterProjectId} placeholder="Lọc theo dự án..." />
            <ModernInput type="date" value={startDateFilter} onChange={e=>setStartDateFilter(e.target.value)} />
            <ModernInput type="date" value={endDateFilter} onChange={e=>setEndDateFilter(e.target.value)} />
          </div>
          <ModernSelect value={itemsPerPage} onChange={e=>setItemsPerPage(Number(e.target.value))}>
            <option value={5}>5/trang</option>
            <option value={10}>10/trang</option>
            <option value={20}>20/trang</option>
            <option value={50}>50/trang</option>
          </ModernSelect>
        </ModernCard>

        {showAddForm && (
          <ModernForm onSubmit={onSubmit} className="mb-6">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Công trình</label>
                <ModernAutocomplete 
                  options={(showCompletedProjects ? projects : projects.filter(p => !p.isCompleted)).map(p => ({ 
                    id: p.id, 
                    label: p.name + (p.isCompleted ? " (đã hoàn thành)" : "") 
                  }))} 
                  value={projectId} 
                  onChange={setProjectId} 
                  placeholder="Chọn dự án..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <ModernInput value={title} onChange={e=>setTitle(e.target.value)} placeholder="Tên hạng mục thuê ngoài" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                <ModernInput type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                <ModernInput type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VND)</label>
                <ModernInput 
                  value={amountVnd}
                  onChange={e=>{ const digits = e.target.value.replace(/\D/g,''); setAmountVnd(new Intl.NumberFormat('vi-VN').format(Number(digits||0))); }}
                  placeholder="Ví dụ: 5.000.000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <ModernInput value={description} onChange={e=>setDescription(e.target.value)} placeholder="Mô tả (tuỳ chọn)" />
              </div>
            </div>
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">{editing ? 'Cập nhật' : 'Thêm thuê ngoài'}</ModernButton>
              <ModernButton type="button" variant="secondary" onClick={resetForm}>Hủy</ModernButton>
            </div>
          </ModernForm>
        )}

        {!loading && filtered.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">Hiển thị {startIndex + 1}-{Math.min(endIndex, filtered.length)} trong {filtered.length} thuê ngoài</div>
        )}

        <div className="space-y-3">
          {loading ? (
            <ModernCard className="text-center py-8"><div className="text-gray-500">Đang tải...</div></ModernCard>
          ) : filtered.length === 0 ? (
            <ModernCard className="text-center py-8"><div className="text-gray-500">Chưa có thuê ngoài</div></ModernCard>
          ) : (
            paginatedItems.map(item => (
              <ModernListItem key={item.id} className="hover:scale-105">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900 mb-1">{item.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{item.project?.name || 'Không xác định'}</div>
                    <div className="text-xs text-gray-500">{new Date(item.startDate).toLocaleDateString('vi-VN')} - {new Date(item.endDate).toLocaleDateString('vi-VN')}</div>
                    {item.description && (<div className="text-sm text-gray-500 mt-1">{item.description}</div>)}
                    <div className="text-sm font-semibold text-amber-700 mt-2">{formatVnd(item.amountVnd)}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={()=>startEdit(item)} className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors w-full sm:w-auto" title="Sửa">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      <span>Sửa</span>
                    </button>
                    <button onClick={()=>confirmDelete(item.id)} className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors w-full sm:w-auto" title="Xóa">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </ModernListItem>
            ))
          )}
        </div>

        <MobilePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {toast && (<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />)}
      {!showAddForm && (
        <FloatingActionButton onClick={()=>setShowAddForm(true)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </FloatingActionButton>
      )}
      <ConfirmDialog open={confirmState.open} title="Xóa thuê ngoài" message="Bạn có chắc chắn muốn xóa mục thuê ngoài này?" confirmText="Xóa" cancelText="Hủy" onCancel={()=>{ setConfirmState({ open: false }); setToast({ message: 'Đã hủy thao tác', type: 'info' }); }} onConfirm={()=>{ const id = confirmState.id!; setConfirmState({ open: false }); doDelete(id); }} />
    </div>
  );
}


