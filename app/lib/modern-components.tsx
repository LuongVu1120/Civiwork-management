"use client";
import React from 'react';

// Modern Card Component
export function ModernCard({ 
  children, 
  className = "", 
  hover = true,
  gradient = false,
  gradientFrom = "from-blue-500",
  gradientTo = "to-blue-600"
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}) {
  const baseClasses = "rounded-2xl shadow-lg transition-all duration-300";
  const hoverClasses = hover ? "hover:shadow-xl hover:scale-105" : "";
  const gradientClasses = gradient ? `bg-gradient-to-br ${gradientFrom} ${gradientTo}` : "bg-white/80 backdrop-blur-sm border border-white/20";
  
  return (
    <div className={`${baseClasses} ${gradientClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}

// Modern Button Component
export function ModernButton({ 
  children, 
  onClick, 
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button"
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white",
    secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white",
    warning: "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// Modern Input Component
export function ModernInput({ 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  className = "",
  error = false,
  required = false
}: { 
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  error?: boolean;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
        error 
          ? "border-red-500 bg-red-50" 
          : "border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500"
      } ${className}`}
    />
  );
}

// Modern Select Component
export function ModernSelect({ 
  value, 
  onChange, 
  children,
  className = "",
  error = false
}: { 
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  error?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
        error 
          ? "border-red-500 bg-red-50" 
          : "border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500"
      } ${className}`}
    >
      {children}
    </select>
  );
}

// Modern Form Component
export function ModernForm({ 
  children, 
  onSubmit, 
  className = ""
}: { 
  children: React.ReactNode; 
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}) {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg space-y-4 ${className}`}
    >
      {children}
    </form>
  );
}

// Modern List Item Component
export function ModernListItem({ 
  children, 
  className = "",
  hover = true
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-lg transition-all duration-300 ${
      hover ? "hover:shadow-xl hover:scale-105" : ""
    } ${className}`}>
      {children}
    </div>
  );
}

// Modern Stats Card Component
export function StatsCard({ 
  title, 
  value, 
  icon, 
  gradient = "from-blue-500 to-blue-600",
  textColor = "text-white"
}: { 
  title: string; 
  value: string | number; 
  icon?: string;
  gradient?: string;
  textColor?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className={`text-sm ${textColor} mb-1`}>{title}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}
