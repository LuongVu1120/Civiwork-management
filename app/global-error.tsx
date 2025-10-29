'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
          <div className="max-w-2xl md:max-w-3xl w-full bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lỗi hệ thống
            </h1>
            <p className="text-gray-600 mb-6">
              Đã xảy ra lỗi nghiêm trọng trong hệ thống. Vui lòng tải lại trang.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={reset}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Tải lại trang
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
