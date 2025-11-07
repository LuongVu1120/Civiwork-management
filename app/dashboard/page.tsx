"use client";
import { useEffect, useState } from "react";
import { formatVnd } from "@/app/lib/format";
import { PageHeader } from "@/app/lib/navigation";
import { ModernCard, ModernButton, ModernSelect } from "@/app/lib/modern-components";
import { LoadingSpinner, Toast } from "@/app/lib/validation";
import { useAuthenticatedFetch } from "@/app/hooks/useAuthenticatedFetch";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import Link from "next/link";

type DashboardStats = {
  projects: number;
  workers: number;
  attendances: number;
  receipts: number;
  expenses: number;
  materials: number;
  externalHires: number;
  totalReceipts: number;
  totalExpenses: number;
  totalMaterials: number;
  totalExternalHires: number;
  netProfit: number;
};

type RecentActivity = {
  id: string;
  type: 'attendance' | 'receipt' | 'material' | 'external_hire';
  description: string;
  date: string;
  amount?: number;
};

export default function DashboardPage() {
  const { loading: authLoading } = useAuthGuard();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [exportProjectId, setExportProjectId] = useState<string>("");

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [statsRes, projectsRes] = await Promise.all([
        authenticatedFetch("/api/dashboard/stats", { cache: "no-store" }),
        authenticatedFetch("/api/projects", { cache: "no-store" })
      ]);
      const statsJson = await statsRes.json();
      setStats({
        projects: statsJson.projects,
        workers: statsJson.workers,
        attendances: statsJson.attendances,
        receipts: statsJson.receipts,
        expenses: statsJson.expenses,
        materials: statsJson.materials,
        externalHires: statsJson.externalHires || 0,
        totalReceipts: statsJson.totalReceipts,
        totalExpenses: statsJson.totalExpenses,
        totalMaterials: statsJson.totalMaterials,
        totalExternalHires: statsJson.totalExternalHires || 0,
        netProfit: statsJson.netProfit
      });
      setRecentActivities(statsJson.recent);
      const projectsData = await projectsRes.json();
      const projectList = Array.isArray(projectsData) ? projectsData : projectsData.items || [];
      setProjects(projectList.map((p: any) => ({ id: p.id, name: p.name })));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setToast({ 
        message: "Có lỗi xảy ra khi tải dữ liệu dashboard", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading]);

  const quickLinks = [
    { href: "/projects", label: "Công trình", icon: "🏗️", color: "bg-blue-500" },
    { href: "/workers", label: "Nhân sự", icon: "👷", color: "bg-green-500" },
    { href: "/attendances", label: "Chấm công", icon: "📅", color: "bg-orange-500" },
    { href: "/receipts", label: "Thu tiền", icon: "💰", color: "bg-emerald-500" },
    { href: "/materials", label: "Vật tư", icon: "🔧", color: "bg-purple-500" },
    { href: "/payroll", label: "Báo cáo lương", icon: "📊", color: "bg-indigo-500" },
    { href: "/external-hires", label: "Thuê ngoài", icon: "🧰", color: "bg-amber-600" }
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-2xl md:max-w-3xl">
        <PageHeader title="Dashboard" />
        <div className="p-4">
          <ModernCard className="text-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 mt-4">Đang tải dữ liệu...</p>
          </ModernCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 mx-auto max-w-2xl md:max-w-3xl">
      <PageHeader title="Dashboard" />
      <div className="p-4 space-y-6">
        
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ModernCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.projects}</div>
                <div className="text-sm text-gray-600">Công trình</div>
              </div>
            </ModernCard>
            <ModernCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.workers}</div>
                <div className="text-sm text-gray-600">Nhân sự</div>
              </div>
            </ModernCard>
            <ModernCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.attendances}</div>
                <div className="text-sm text-gray-600">Chấm công</div>
              </div>
            </ModernCard>
            <ModernCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.materials}</div>
                <div className="text-sm text-gray-600">Vật tư</div>
              </div>
            </ModernCard>
            <ModernCard className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.externalHires}</div>
                <div className="text-sm text-gray-600">Thuê ngoài</div>
              </div>
            </ModernCard>
          </div>
        )}

        {/* Financial Summary */}
        {stats && (
          <ModernCard className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt tài chính</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tổng thu:</span>
                <span className="font-semibold text-green-600">{formatVnd(stats.totalReceipts)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tổng chi (Vật tư + Thuê ngoài):</span>
                <span className="font-semibold text-red-600">{formatVnd((stats.totalMaterials || 0) + (stats.totalExternalHires || 0))}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Lợi nhuận:</span>
                  <span className={`font-bold text-lg ${ (stats.totalReceipts - ((stats.totalMaterials||0) + (stats.totalExternalHires||0))) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatVnd(stats.totalReceipts - ((stats.totalMaterials||0) + (stats.totalExternalHires||0)))}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Xuất Excel theo công trình</label>
                  <div className="flex gap-2">
                    <ModernSelect value={exportProjectId} onChange={e=>setExportProjectId(e.target.value)} className="flex-1">
                      <option value="">Chọn công trình...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </ModernSelect>
                    <ModernButton
                      onClick={async ()=>{
                        if (!exportProjectId) { setToast({ message: 'Vui lòng chọn công trình', type: 'error' }); return; }
                        try {
                          const res = await authenticatedFetch(`/api/dashboard/export?projectId=${exportProjectId}`, { cache: 'no-store' });
                          if (!res.ok) throw new Error('Export failed');
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = 'civiwork-export.xlsx'; a.click();
                          window.URL.revokeObjectURL(url);
                        } catch (e) {
                          setToast({ message: 'Xuất Excel thất bại', type: 'error' });
                        }
                      }}
                    >
                      Tải về
                    </ModernButton>
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Quick Links */}
        <ModernCard className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Truy cập nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <ModernButton 
                  variant="secondary" 
                  className="w-full h-16 flex flex-col items-center justify-center space-y-1 hover:scale-105 transition-transform"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                </ModernButton>
              </Link>
            ))}
          </div>
        </ModernCard>

        {/* Recent Activities */}
        {recentActivities.length > 0 && (
          <ModernCard className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      activity.type === 'attendance' ? 'bg-orange-500' :
                      activity.type === 'receipt' ? 'bg-emerald-500' :
                      activity.type === 'external_hire' ? 'bg-amber-600' :
                      'bg-purple-500'
                    }`}>
                      {activity.type === 'attendance' ? '📅' :
                       activity.type === 'receipt' ? '💰' :
                       activity.type === 'external_hire' ? '🧰' : '🔧'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  {activity.amount && (
                    <div className="text-sm font-semibold text-gray-700">
                      {formatVnd(activity.amount)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ModernCard>
        )}

        {/* Welcome Message */}
        <ModernCard className="p-4 text-center">
          <div className="text-4xl mb-2">👋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chào mừng đến với CiviWork</h3>
          <p className="text-gray-600 text-sm">
            Quản lý công trình xây dựng một cách hiệu quả và chuyên nghiệp
          </p>
        </ModernCard>

      </div>

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
