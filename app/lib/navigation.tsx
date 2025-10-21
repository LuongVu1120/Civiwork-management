"use client";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  rightAction?: React.ReactNode;
  showHomeButton?: boolean;
}

export function PageHeader({ title, showBackButton = true, backUrl, rightAction, showHomeButton = true }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    router.push("/");
  };

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Quay lại"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {showHomeButton && (
          <button
            onClick={handleHome}
            className="p-2.5 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 group"
            aria-label="Về trang chủ"
          >
            <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        )}
        {rightAction && rightAction}
      </div>
    </div>
  );
}

// Quick action buttons for common operations
export function QuickActionButton({ 
  onClick, 
  children, 
  variant = "primary",
  disabled = false 
}: { 
  onClick: () => void; 
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white", 
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

// Breadcrumb navigation
export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span>›</span>}
          {item.href ? (
            <button
              onClick={() => router.push(item.href!)}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Floating action button for mobile
export function FloatingActionButton({ 
  onClick, 
  children, 
  position = "bottom-right" 
}: { 
  onClick: () => void; 
  children: React.ReactNode;
  position?: "bottom-right" | "bottom-left";
}) {
  const positions = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4"
  };

  return (
    <button
      onClick={onClick}
      className={`fixed ${positions[position]} w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50 backdrop-blur-sm`}
      aria-label="Thêm mới"
    >
      <div className="transform transition-transform duration-200 hover:rotate-90">
        {children}
      </div>
    </button>
  );
}
