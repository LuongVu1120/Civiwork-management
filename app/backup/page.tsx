"use client";
import { useState } from "react";
import { LoadingSpinner, Toast } from "@/app/lib/validation";
import { PageHeader } from "@/app/lib/navigation";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function exportData() {
    try {
      setLoading(true);
      
      // Fetch all data
      const [workersRes, projectsRes, attendancesRes, receiptsRes, expensesRes, materialsRes] = await Promise.all([
        fetch("/api/workers", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/attendances", { cache: "no-store" }),
        fetch("/api/receipts", { cache: "no-store" }),
        fetch("/api/expenses", { cache: "no-store" }),
        fetch("/api/materials", { cache: "no-store" })
      ]);

      const [workers, projects, attendances, receipts, expenses, materials] = await Promise.all([
        workersRes.json(),
        projectsRes.json(),
        attendancesRes.json(),
        receiptsRes.json(),
        expensesRes.json(),
        materialsRes.json()
      ]);

      // Create backup data
      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          workers,
          projects,
          attendances,
          receipts,
          expenses,
          materials
        }
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `civiwork-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setToast({ message: "Xuất dữ liệu thành công!", type: "success" });
    } catch (error) {
      setToast({ message: "Có lỗi xảy ra khi xuất dữ liệu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validate backup format
      if (!backupData.version || !backupData.data) {
        throw new Error("File backup không hợp lệ");
      }

      // Import each data type
      const { workers, projects, attendances, receipts, expenses, materials } = backupData.data;

      if (workers?.length > 0) {
        await Promise.all(workers.map((worker: any) => 
          fetch("/api/workers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(worker)
          })
        ));
      }

      if (projects?.length > 0) {
        await Promise.all(projects.map((project: any) => 
          fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(project)
          })
        ));
      }

      if (attendances?.length > 0) {
        await Promise.all(attendances.map((attendance: any) => 
          fetch("/api/attendances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attendance)
          })
        ));
      }

      if (receipts?.length > 0) {
        await Promise.all(receipts.map((receipt: any) => 
          fetch("/api/receipts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(receipt)
          })
        ));
      }

      if (expenses?.length > 0) {
        await Promise.all(expenses.map((expense: any) => 
          fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense)
          })
        ));
      }

      if (materials?.length > 0) {
        await Promise.all(materials.map((material: any) => 
          fetch("/api/materials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(material)
          })
        ));
      }

      setToast({ message: "Nhập dữ liệu thành công!", type: "success" });
      
      // Reset file input
      event.target.value = "";
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Có lỗi xảy ra khi nhập dữ liệu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <PageHeader title="Sao lưu & Khôi phục" />

      <div className="p-4">
        {/* Export Section */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h2 className="text-lg font-medium mb-3">Xuất dữ liệu</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tạo file backup chứa toàn bộ dữ liệu của hệ thống
          </p>
          <button 
            onClick={exportData}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <LoadingSpinner size="sm" />}
            Xuất dữ liệu
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h2 className="text-lg font-medium mb-3">Nhập dữ liệu</h2>
          <p className="text-sm text-gray-600 mb-4">
            Khôi phục dữ liệu từ file backup (sẽ thêm vào dữ liệu hiện tại)
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              disabled={loading}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg cursor-pointer disabled:opacity-50"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ Lưu ý quan trọng</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• File backup chứa toàn bộ dữ liệu nhạy cảm</li>
            <li>• Hãy bảo mật file backup cẩn thận</li>
            <li>• Nhập dữ liệu sẽ thêm vào dữ liệu hiện tại, không thay thế</li>
            <li>• Khuyến nghị xuất backup định kỳ</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a href="/dashboard" className="bg-gray-600 text-white p-3 rounded-xl text-center font-medium">
            Dashboard
          </a>
          <a href="/" className="bg-gray-600 text-white p-3 rounded-xl text-center font-medium">
            Trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
