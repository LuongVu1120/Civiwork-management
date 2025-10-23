"use client";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { ModernButton } from "@/app/lib/modern-components";

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'MANAGER': return 'Quản lý';
      case 'USER': return 'Người dùng';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'USER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center space-x-3">
      
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={logoutLoading}
        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-1"
      >
        {logoutLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Đang đăng xuất...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Đăng xuất</span>
          </>
        )}
      </button>
    </div>
  );
}
