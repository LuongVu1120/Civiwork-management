"use client";
import { useEffect, useState, use } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader, FloatingActionButton } from "@/app/lib/navigation";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";

type Totals = {
  receipts: number;
  materials: number;
  externalHires: number;
  wageEstimated: number;
  cashIn: number;
  cashOut: number;
  grossProfitEstimated: number;
};

export default function ProjectCashflowPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ year?: string; month?: string }> }) {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const projectId = resolvedParams.id;
  const [data, setData] = useState<{ 
    totals: Totals; 
    project?: { name: string; startDate: string | null; endDate: string | null; isCompleted: boolean; updatedAt: string };
    period?: { type: "month" | "all"; startDate?: string; endDate?: string };
    details?: { 
      receipts: Array<{ date: string; amountVnd: number; description?: string | null }>; 
      materials: Array<{ date: string; totalVnd: number }>;
      externalHires: Array<{ id: string; title: string; description?: string | null; startDate: string; endDate: string; amountVnd: number }>;
    } 
  } | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [showMonthFilter, setShowMonthFilter] = useState<boolean>(false);
  const [year, setYear] = useState<number>(Number(resolvedSearchParams?.year) || new Date().getFullYear());
  const [month, setMonth] = useState<number>(Number(resolvedSearchParams?.month) || new Date().getMonth() + 1);
  const [selected, setSelected] = useState<string>(projectId);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    
    try {
      const query = new URLSearchParams();
      // Only add year/month filter if user explicitly wants to filter by month
      if (showMonthFilter && year && month) {
        query.set("year", String(year));
        query.set("month", String(month));
      }
      
      const [pRes, cfRes] = await Promise.all([
        authenticatedFetch(`/api/projects`, { cache: "no-store" }),
        authenticatedFetch(`/api/projects/${selected}/cashflow${query.toString() ? `?${query.toString()}` : ""}`, { cache: "no-store" }),
      ]);
      
      if (!pRes.ok) {
        throw new Error(`Failed to load projects: ${pRes.status}`);
      }
      
      if (!cfRes.ok) {
        const errorText = await cfRes.text();
        let errorMessage = `Failed to load cashflow: ${cfRes.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use the text as error message
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const projectsData = await pRes.json();
      const cashflowData = await cfRes.json();
      
      if (cashflowData.error) {
        console.error('API Error:', cashflowData.error);
        
        // Handle specific database connection errors
        if (cashflowData.error.includes('database') || cashflowData.error.includes('connection')) {
          setError('Lỗi kết nối database. Vui lòng kiểm tra kết nối mạng và thử lại.');
        } else {
          setError(cashflowData.error);
        }
        
        setData(null);
        return;
      }
      
      // Ensure projects is always an array
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData.items || []);
      setProjects(projectsList);
      setData(cashflowData);
    } catch (error) {
      console.error('Error loading data:', error);
      
      let errorMessage = 'Không thể tải dữ liệu dòng tiền';
      
      if (error instanceof Error) {
        if (error.message.includes('503')) {
          errorMessage = 'Lỗi kết nối database. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (error.message.includes('database') || error.message.includes('connection')) {
          errorMessage = 'Lỗi kết nối database. Vui lòng kiểm tra cài đặt database.';
        } else if (error.message.includes('Failed to load')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [selected, year, month, showMonthFilter]);

  const t = data?.totals;
  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-2xl md:max-w-3xl">
      <PageHeader title="Dòng tiền công trình" />
      <div className="p-4">
      <div className="bg-white p-3 rounded-xl border shadow-sm mb-3 space-y-3">
        <select value={selected} onChange={e=>setSelected(e.target.value)} className="border rounded px-2 py-2 w-full">
          {Array.isArray(projects) && projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        
        {/* Period Info */}
        {data?.project && data?.period && (
          <div className="bg-gray-50 p-2 rounded text-sm">
            <div className="font-medium mb-1">Thời gian dự án:</div>
            <div className="text-gray-600">
              {data.project.startDate ? (
                <>Bắt đầu: {new Date(data.project.startDate).toLocaleDateString('vi-VN')}</>
              ) : 'Chưa có ngày bắt đầu'}
              {data.project.isCompleted && data.project.endDate ? (
                <> · Kết thúc: {new Date(data.project.endDate).toLocaleDateString('vi-VN')}</>
              ) : (
                <> · Cập nhật lần cuối: {new Date(data.project.updatedAt).toLocaleDateString('vi-VN')}</>
              )}
            </div>
            {data.period.type === "all" && (
              <div className="text-blue-600 mt-1">
                📊 Đang hiển thị tổng hợp từ đầu dự án
              </div>
            )}
          </div>
        )}
        
        {/* Month Filter Toggle */}
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="monthFilter" 
            checked={showMonthFilter}
            onChange={e=>setShowMonthFilter(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="monthFilter" className="text-sm">Lọc theo tháng</label>
        </div>
        
        {/* Month Filter Inputs */}
        {showMonthFilter && (
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="number" 
              value={year} 
              onChange={e=>setYear(Number(e.target.value))} 
              placeholder="Năm"
              className="border rounded px-2 py-2" 
            />
            <input 
              type="number" 
              min={1} 
              max={12} 
              value={month} 
              onChange={e=>setMonth(Number(e.target.value))} 
              placeholder="Tháng"
              className="border rounded px-2 py-2" 
            />
          </div>
        )}
        
        <button onClick={load} className="rounded bg-black text-white py-2 w-full">Làm mới</button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-4 rounded-xl border shadow-sm mb-4">
          <div className="text-center">
            <div className="text-gray-500">Đang tải dữ liệu dòng tiền...</div>
          </div>
        </div>
      )}

      {/* Data Display */}
      {!loading && !error && t ? (
        <div className="space-y-2">
          <Card label="Thu (receipts)" value={formatVnd(t.receipts)} />
          <Card label="Vật tư (materials)" value={formatVnd(t.materials)} />
          <Card label="Thuê ngoài (external hires)" value={formatVnd(t.externalHires)} />
          <Card label="Lương ước tính (attendance)" value={formatVnd(t.wageEstimated)} />
          <Card label="Tiền vào (cashIn)" value={formatVnd(t.cashIn)} />
          <Card label="Tiền ra (cashOut)" value={formatVnd(t.cashOut)} />
          <Card label="Lợi nhuận gộp ước tính" value={formatVnd(t.grossProfitEstimated)} highlight />
          <div className="mt-2">
            <h2 className="font-medium mb-1">Chi tiết</h2>
            <DetailTable title="Thu tiền" rows={data?.details?.receipts || []} amountKey="amountVnd" />
            <DetailTable title="Mua vật tư" rows={data?.details?.materials || []} amountKey="totalVnd" />
            <DetailTable 
              title="Thuê ngoài" 
              rows={data?.details?.externalHires?.map(eh => ({
                date: eh.startDate,
                title: eh.title,
                description: eh.description,
                period: `${new Date(eh.startDate).toLocaleDateString('vi-VN')} - ${new Date(eh.endDate).toLocaleDateString('vi-VN')}`,
                amountVnd: eh.amountVnd
              })) || []} 
              amountKey="amountVnd" 
            />
          </div>
        </div>
      ) : !loading && !error && !t && (
        <div className="text-gray-500 text-center py-8">
          <div className="mb-4">
            <div className="text-6xl mb-2">📊</div>
            <h3 className="text-lg font-medium mb-2">Không có dữ liệu dòng tiền</h3>
            <p className="text-sm text-gray-400 mb-4">
              Có thể do chưa có dữ liệu hoặc lỗi kết nối database
            </p>
            <div className="space-y-2">
              <button 
                onClick={load}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔄 Thử lại
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/health');
                    const health = await res.json();
                    alert(`Database Status: ${health.database?.connected ? '✅ Connected' : '❌ Disconnected'}`);
                  } catch (e) {
                    alert('❌ Không thể kiểm tra database health');
                  }
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors ml-2"
              >
                🔍 Kiểm tra Database
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function Card({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`bg-white p-3 rounded-xl border shadow-sm ${highlight ? "border-black" : ""}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-semibold">{typeof value === "number" ? formatVnd(value) : value}</div>
    </div>
  );
}

function DetailTable({ title, rows, amountKey }: { title: string; rows: Array<{ date: string; [key: string]: unknown }>; amountKey: string }) {
  return (
    <div className="bg-white p-3 rounded-xl border shadow-sm mb-2">
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex-1">
              {(r as any).period ? (
                <div>
                  <div className="font-medium">{String((r as any).title || new Date(r.date).toLocaleDateString('vi-VN'))}</div>
                  <div className="text-xs text-gray-500">{String((r as any).period)}</div>
                  {(r as any).description && <div className="text-xs text-gray-500">{String((r as any).description)}</div>}
                </div>
              ) : (
                <div>
                  {new Date(r.date).toLocaleDateString('vi-VN')}
                  {(r as any).description && <span className="ml-1">· {String((r as any).description)}</span>}
                </div>
              )}
            </div>
            <div className="font-medium ml-2">{formatVnd(Number(r[amountKey] ?? 0))}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-gray-400 text-sm">Không có dữ liệu</div>}
      </div>
    </div>
  );
}


