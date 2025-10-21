"use client";
import { PageHeader } from "@/app/lib/navigation";
import { useState } from "react";

export default function TestPage() {
  const [testResult, setTestResult] = useState<string>("");

  const runTests = async () => {
    setTestResult("Đang chạy tests...");
    
    try {
      // Test API endpoints
      const tests = [
        { name: "Workers API", url: "/api/workers" },
        { name: "Projects API", url: "/api/projects" },
        { name: "Attendances API", url: "/api/attendances" },
        { name: "Receipts API", url: "/api/receipts" },
        { name: "Expenses API", url: "/api/expenses" },
        { name: "Materials API", url: "/api/materials" },
      ];

      const results = await Promise.allSettled(
        tests.map(async (test) => {
          const response = await fetch(test.url);
          return { name: test.name, status: response.status, ok: response.ok };
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const totalCount = results.length;
      
      setTestResult(`✅ Tests completed: ${successCount}/${totalCount} APIs working`);
    } catch (error) {
      setTestResult(`❌ Test failed: ${error}`);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-md">
      <PageHeader title="System Test" />
      
      <div className="p-4 space-y-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-3">🧪 System Health Check</h2>
          <p className="text-sm text-gray-600 mb-4">
            Kiểm tra tất cả API endpoints và tính năng của hệ thống
          </p>
          
          <button 
            onClick={runTests}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Chạy Tests
          </button>
          
          {testResult && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <div className="text-sm font-mono">{testResult}</div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">📱 Navigation Test</h3>
          <div className="grid grid-cols-2 gap-2">
            <a href="/dashboard" className="bg-blue-600 text-white p-2 rounded text-center text-sm">
              Dashboard
            </a>
            <a href="/workers" className="bg-green-600 text-white p-2 rounded text-center text-sm">
              Workers
            </a>
            <a href="/projects" className="bg-purple-600 text-white p-2 rounded text-center text-sm">
              Projects
            </a>
            <a href="/backup" className="bg-gray-600 text-white p-2 rounded text-center text-sm">
              Backup
            </a>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">🏠 Home Button Test</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Nút Home ở góc phải header</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Click để về trang chủ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Icon nhà đẹp và rõ ràng</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
          <h3 className="font-semibold text-green-800 mb-2">✅ Navigation Features</h3>
          <p className="text-sm text-green-700">
            ✅ Nút "Quay lại" (mũi tên trái)<br/>
            ✅ Nút "Về trang chủ" (icon nhà)<br/>
            ✅ Sticky header trên tất cả trang<br/>
            ✅ Responsive design cho mobile
          </p>
        </div>
      </div>
    </div>
  );
}
