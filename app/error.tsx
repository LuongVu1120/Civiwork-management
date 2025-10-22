'use client';

import { useEffect } from 'react';
import { ModernCard, ModernButton } from '@/app/lib/modern-components';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <ModernCard className="max-w-md w-full text-center">
        <div className="p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Có lỗi xảy ra
          </h1>
          <p className="text-gray-600 mb-6">
            Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-red-800 mb-2">Chi tiết lỗi (Development):</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap break-words">
                {error.message}
                {error.stack && `\n\nStack trace:\n${error.stack}`}
              </pre>
            </div>
          )}
          
          <div className="space-y-3">
            <ModernButton 
              onClick={reset}
              className="w-full"
            >
              Thử lại
            </ModernButton>
            
            <ModernButton 
              onClick={() => window.location.href = '/'}
              variant="secondary"
              className="w-full"
            >
              Về trang chủ
            </ModernButton>
          </div>
        </div>
      </ModernCard>
    </div>
  );
}
