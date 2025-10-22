"use client";
import { useEffect, useState } from "react";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernInput, ModernForm, ModernListItem, ModernSelect } from "@/app/lib/modern-components";
import { MobilePagination, usePagination } from "@/app/lib/pagination";

type Project = { id: string; name: string; clientName?: string | null };

export default function ProjectsPage() {
  const [list, setList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      setList(await res.json());
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { refresh(); }, []);

  // Filter projects based on search
  const filteredProjects = list.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.clientName && project.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const { currentPage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage } = 
    usePagination(filteredProjects, itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    resetPage();
  }, [searchTerm, itemsPerPage]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, clientName: clientName || null }),
      });
      setName("");
      setClientName("");
      setShowAddForm(false);
      await refresh();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-md">
      <PageHeader title="Công trình" />
      <div className="p-4">
        
        {/* Search and Filter */}
        <ModernCard className="mb-6 space-y-3">
          <ModernInput
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên công trình hoặc chủ đầu tư..."
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
          <ModernForm onSubmit={createProject} className="mb-6">
            <ModernInput 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              placeholder="Tên công trình" 
              required 
            />
            <ModernInput 
              value={clientName} 
              onChange={e=>setClientName(e.target.value)} 
              placeholder="Chủ đầu tư (tuỳ chọn)" 
            />
            <div className="flex gap-3">
              <ModernButton type="submit" className="flex-1">
                Thêm công trình
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
        {!loading && filteredProjects.length > 0 && (
          <div className="text-sm text-gray-600 mb-3 px-1">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)} trong {filteredProjects.length} công trình
          </div>
        )}
        
        <div className="space-y-3">
          {loading ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">Đang tải...</div>
            </ModernCard>
          ) : filteredProjects.length === 0 ? (
            <ModernCard className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm ? "Không tìm thấy công trình nào" : "Chưa có công trình nào"}
              </div>
            </ModernCard>
          ) : (
            paginatedItems.map(p => (
              <ModernListItem key={p.id} className="hover:scale-105">
                <div className="font-semibold text-lg text-gray-900 mb-1">{p.name}</div>
                {p.clientName && (
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {p.clientName}
                    </span>
                  </div>
                )}
                <div className="mt-3">
                  <a 
                    href={`/projects/${p.id}/cashflow`} 
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Xem dòng tiền
                  </a>
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
    </div>
  );
}


