"use client";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    } 
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", gradient: "from-blue-500 to-blue-600", hover: "hover:from-blue-600 hover:to-blue-700" },
    { href: "/attendances", label: "Chấm công", icon: "📅", gradient: "from-purple-500 to-purple-600", hover: "hover:from-purple-600 hover:to-purple-700" },
    { href: "/workers", label: "Nhân sự", icon: "👥", gradient: "from-indigo-500 to-indigo-600", hover: "hover:from-indigo-600 hover:to-indigo-700" },
    { href: "/projects", label: "Công trình", icon: "🏗️", gradient: "from-green-500 to-green-600", hover: "hover:from-green-600 hover:to-green-700" },
    { href: "/receipts", label: "Thu tiền", icon: "💰", gradient: "from-emerald-500 to-emerald-600", hover: "hover:from-emerald-600 hover:to-emerald-700" },
    { href: "/materials", label: "Vật tư", icon: "🔨", gradient: "from-orange-500 to-orange-600", hover: "hover:from-orange-600 hover:to-orange-700" },
    { href: "/external-hires", label: "Thuê ngoài", icon: "🧰", gradient: "from-amber-600 to-amber-700", hover: "hover:from-amber-700 hover:to-amber-800" },
    { href: "/payroll/monthly", label: "Bảng công", icon: "📋", gradient: "from-pink-500 to-pink-600", hover: "hover:from-pink-600 hover:to-pink-700" },
    // { href: "/backup", label: "Sao lưu", icon: "💾", gradient: "from-gray-500 to-gray-600", hover: "hover:from-gray-600 hover:to-gray-700" },
    // { href: "/test", label: "Test", icon: "🧪", gradient: "from-yellow-500 to-yellow-600", hover: "hover:from-yellow-600 hover:to-yellow-700" },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <main className="mx-auto max-w-2xl md:max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            CiviWork
          </h1>
          <p className="text-gray-600 text-lg">Quản lý thu chi & chấm công</p>
          <div className="mt-4 text-sm text-gray-500">
            Xin chào, <span className="font-semibold text-gray-700">{user.fullName}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {links.map((l) => (
            <a 
              key={l.href} 
              href={l.href} 
              className={`bg-gradient-to-br ${l.gradient} ${l.hover} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-300 group`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{l.icon}</div>
              <div className="font-semibold text-sm">{l.label}</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
