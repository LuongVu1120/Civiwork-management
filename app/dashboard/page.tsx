"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader } from "@/app/lib/navigation";
import { SkeletonStats, SkeletonList } from "@/app/lib/skeleton";
import { useApi } from "@/app/lib/use-api";

type DashboardStats = {
  totalWorkers: number;
  activeProjects: number;
  totalReceipts: number;
  totalExpenses: number;
  totalMaterials: number;
  netProfit: number;
  thisMonthPayroll: number;
  recentActivities: Array<{
    type: string;
    description: string;
    amount?: number;
    date: string;
  }>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      setError(null);
      
      // Load basic counts with individual error handling
      const [workersRes, projectsRes, receiptsRes, expensesRes, materialsRes] = await Promise.all([
        fetch("/api/workers", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/receipts", { cache: "no-store" }),
        fetch("/api/expenses", { cache: "no-store" }),
        fetch("/api/materials", { cache: "no-store" })
      ]);

      // Check each response individually
      const responses = [
        { res: workersRes, name: 'workers' },
        { res: projectsRes, name: 'projects' },
        { res: receiptsRes, name: 'receipts' },
        { res: expensesRes, name: 'expenses' },
        { res: materialsRes, name: 'materials' }
      ];

      const data: any = {};
      
      for (const { res, name } of responses) {
        try {
          if (!res.ok) {
            console.error(`Failed to fetch ${name}:`, res.status, res.statusText);
            data[name] = [];
            continue;
          }
          
          const text = await res.text();
          if (!text) {
            console.error(`Empty response for ${name}`);
            data[name] = [];
            continue;
          }
          
          try {
            data[name] = JSON.parse(text);
          } catch (parseError) {
            console.error(`Failed to parse JSON for ${name}:`, parseError);
            console.error(`Response text:`, text);
            data[name] = [];
          }
        } catch (error) {
          console.error(`Error processing ${name}:`, error);
          data[name] = [];
        }
      }

      const { workers, projects, receipts, expenses, materials } = data;

      // Calculate totals with error handling
      const totalReceipts = (receipts || []).reduce((sum: number, r: { amountVnd: number }) => sum + (r.amountVnd || 0), 0);
      const totalExpenses = (expenses || []).reduce((sum: number, e: { amountVnd: number }) => sum + (e.amountVnd || 0), 0);
      const totalMaterials = (materials || []).reduce((sum: number, m: { totalVnd: number }) => sum + (m.totalVnd || 0), 0);

      // Get current month payroll with error handling
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      let thisMonthPayroll = 0;
      try {
        const payrollRes = await fetch(`/api/payroll/monthly?year=${currentYear}&month=${currentMonth}`, { cache: "no-store" });
        
        if (payrollRes.ok) {
          const payrollText = await payrollRes.text();
          if (payrollText) {
            try {
              const payrollData = JSON.parse(payrollText);
              thisMonthPayroll = payrollData.totalPayableVnd || 0;
            } catch (parseError) {
              console.error('Failed to parse payroll JSON:', parseError);
              console.error('Payroll response text:', payrollText);
            }
          }
        } else {
          console.error('Payroll API failed:', payrollRes.status, payrollRes.statusText);
        }
      } catch (payrollError) {
        console.error('Error fetching payroll:', payrollError);
      }

      // Generate recent activities (last 10 items from each category) with error handling
      const recentActivities = [
        ...(receipts || []).slice(0, 3).map((r: any) => ({
          type: "receipt",
          description: `Thu tiền: ${r.description || "Không có mô tả"}`,
          amount: r.amountVnd,
          date: r.date
        })),
        ...(expenses || []).slice(0, 3).map((e: any) => ({
          type: "expense",
          description: `Chi tiền: ${e.description || "Không có mô tả"}`,
          amount: e.amountVnd,
          date: e.date
        })),
        ...(materials || []).slice(0, 3).map((m: any) => ({
          type: "material",
          description: `Mua vật tư: ${m.itemName || "Không có mô tả"}`,
          amount: m.totalVnd,
          date: m.date
        }))
      ]
      .filter(activity => activity.date) // Filter out activities without dates
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

      setStats({
        totalWorkers: (workers || []).length,
        activeProjects: (projects || []).length,
        totalReceipts,
        totalExpenses,
        totalMaterials,
        netProfit: totalReceipts - totalExpenses - totalMaterials - thisMonthPayroll,
        thisMonthPayroll,
        recentActivities
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
        <PageHeader title="Dashboard" showBackButton={false} showHomeButton={true} />
        <div className="p-4">
          <SkeletonStats className="mb-6" />
          <SkeletonList count={3} />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-dvh bg-gray-50 p-4 mx-auto max-w-md flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg font-semibold mb-2 text-red-600">
            {error || "Lỗi tải dữ liệu"}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Có thể do lỗi kết nối database hoặc API không phản hồi
          </p>
          <div className="space-y-2">
            <button 
              onClick={loadStats} 
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
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
      <PageHeader title="Dashboard" showBackButton={false} showHomeButton={true} />
      <div className="p-4">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-600">Tổng nhân sự</div>
          <div className="text-lg font-semibold">{stats.totalWorkers}</div>
        </div>
        
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-600">Dự án đang làm</div>
          <div className="text-lg font-semibold">{stats.activeProjects}</div>
        </div>
        
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-600">Tổng thu</div>
          <div className="text-lg font-semibold text-green-600">{formatVnd(stats.totalReceipts)}</div>
        </div>
        
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-600">Tổng chi</div>
          <div className="text-lg font-semibold text-red-600">{formatVnd(stats.totalExpenses)}</div>
        </div>
        
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-600">Vật tư</div>
          <div className="text-lg font-semibold text-orange-600">{formatVnd(stats.totalMaterials)}</div>
        </div>
        
        <div className="bg-white p-3 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-600">Lương tháng này</div>
          <div className="text-lg font-semibold text-blue-600">{formatVnd(stats.thisMonthPayroll)}</div>
        </div>
      </div>

      {/* Net Profit */}
      <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Lợi nhuận ước tính</div>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatVnd(stats.netProfit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Thu - Chi - Vật tư - Lương
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Hoạt động gần đây</h2>
        <div className="space-y-2">
          {stats.recentActivities.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Chưa có hoạt động nào
            </div>
          ) : (
            stats.recentActivities.map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="text-sm font-medium">{activity.description}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                {activity.amount && (
                  <div className={`text-sm font-semibold ${
                    activity.type === 'receipt' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.type === 'receipt' ? '+' : '-'}{formatVnd(activity.amount)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <a href="/workers" className="bg-blue-600 text-white p-3 rounded-xl text-center font-medium">
          Quản lý nhân sự
        </a>
        <a href="/projects" className="bg-green-600 text-white p-3 rounded-xl text-center font-medium">
          Quản lý dự án
        </a>
        <a href="/payroll/monthly" className="bg-purple-600 text-white p-3 rounded-xl text-center font-medium">
          Bảng công tháng
        </a>
        <a href="/receipts" className="bg-orange-600 text-white p-3 rounded-xl text-center font-medium">
          Quản lý thu chi
        </a>
      </div>
      </div>
    </div>
  );
}
