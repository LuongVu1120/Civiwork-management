'use client';

import React from 'react';

// Skeleton loading components
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-lg animate-pulse ${className}`}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonStats({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-white/20 shadow-lg animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-4 border-b border-gray-100 last:border-0 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg space-y-4 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-12 bg-gray-200 rounded flex-1"></div>
        <div className="h-12 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}

// Loading spinner with different sizes
export function LoadingSpinner({ 
  size = "md", 
  className = "" 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}></div>
  );
}

// Loading overlay
export function LoadingOverlay({ 
  message = "Đang tải...", 
  className = "" 
}: { 
  message?: string; 
  className?: string; 
}) {
  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Shimmer effect for cards
export function ShimmerCard({ children, loading, className = "" }: { 
  children: React.ReactNode; 
  loading: boolean; 
  className?: string; 
}) {
  if (loading) {
    return <SkeletonCard className={className} />;
  }
  
  return <>{children}</>;
}
