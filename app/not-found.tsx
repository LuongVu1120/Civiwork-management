import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-semibold mb-2">Trang không tồn tại</h1>
        <p className="text-gray-600 mb-6">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link 
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
