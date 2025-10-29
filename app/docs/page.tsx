'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/lib/navigation';
import { ModernCard } from '@/app/lib/modern-components';

export default function DocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setSwaggerSpec(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load API docs:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 mx-auto max-w-2xl md:max-w-3xl">
        <PageHeader title="API Documentation" />
        <div className="p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Đang tải tài liệu API...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 mx-auto max-w-4xl">
      <PageHeader title="API Documentation" />
      <div className="p-4">
        <ModernCard className="mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Civiwork Management API
            </h1>
            <p className="text-gray-600 mb-4">
              API tài liệu cho hệ thống quản lý thu chi và chấm công công trình xây dựng.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Base URL</h3>
                <code className="text-sm text-blue-700">
                  {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
                </code>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Version</h3>
                <span className="text-sm text-green-700">v1.0.0</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Endpoints chính</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">GET /api/workers</span>
                    <span className="text-sm text-gray-600">Quản lý nhân sự</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">GET /api/projects</span>
                    <span className="text-sm text-gray-600">Quản lý dự án</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">GET /api/attendances</span>
                    <span className="text-sm text-gray-600">Chấm công</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">GET /api/health</span>
                    <span className="text-sm text-gray-600">Kiểm tra sức khỏe hệ thống</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h3>
                <p className="text-sm text-gray-600 mb-2">
                  API sử dụng session-based authentication. Một số endpoints yêu cầu đăng nhập.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Hiện tại hệ thống chưa có authentication hoàn chỉnh. 
                    Tất cả endpoints đều có thể truy cập mà không cần đăng nhập.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rate Limiting</h3>
                <p className="text-sm text-gray-600 mb-2">
                  API có giới hạn số lượng request để bảo vệ hệ thống:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• GET requests: 100 requests/15 phút</li>
                  <li>• POST requests: 20 requests/15 phút</li>
                  <li>• Khi vượt quá giới hạn sẽ trả về HTTP 429</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Handling</h3>
                <p className="text-sm text-gray-600 mb-2">
                  API trả về lỗi theo format chuẩn:
                </p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "error": "Validation Error",
  "details": [
    {
      "field": "fullName",
      "message": "Họ tên là bắt buộc"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        </ModernCard>

        <div className="text-center">
          <a 
            href="/api/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Xem OpenAPI Spec (JSON)
          </a>
        </div>
      </div>
    </div>
  );
}
