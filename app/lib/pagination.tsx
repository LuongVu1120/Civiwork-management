'use client';
import { useEffect, useState } from 'react';
import { usePersistedParams } from '@/app/hooks/usePersistedParams';

// Reusable mobile-optimized pagination component
export function MobilePagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    // For mobile, show fewer pages to save space
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="mt-6">
      {/* Page info */}
      <div className="text-center text-sm text-gray-600 mb-3">
        Trang {currentPage} / {totalPages}
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center justify-center space-x-1">
        {/* First page */}
        {currentPage > 2 && (
          <button
            onClick={() => onPageChange(1)}
            className="px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            «
          </button>
        )}

        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        {/* Page numbers */}
        {visiblePages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 text-sm font-medium rounded-lg min-w-[40px] ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : page === '...'
                ? 'text-gray-400 cursor-default'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ›
        </button>

        {/* Last page */}
        {currentPage < totalPages - 1 && (
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            »
          </button>
        )}
      </div>
    </div>
  );
}

// Hook for pagination logic
export function usePagination<T>(items: T[], itemsPerPage: number = 10, totalItemsOverride?: number) {
  const { values, setParam } = usePersistedParams({
    page: { type: 'number', default: 1 },
    limit: { type: 'number', default: itemsPerPage }
  });

  const currentPage = Math.max(1, values.page);
  const limit = Math.max(1, values.limit);

  const totalItems = totalItemsOverride ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * limit;
  const endIndex = startIndex + limit;
  // Nếu caller truyền totalItemsOverride, coi như items đã được phân trang ở server → không slice lần nữa
  const paginatedItems = totalItemsOverride !== undefined ? items : items.slice(startIndex, endIndex);

  const setCurrentPage = (page: number) => setParam('page', Math.max(1, page));
  const resetPage = () => setParam('page', 1);

  // Keep limit in sync when caller changes itemsPerPage prop
  useEffect(() => {
    if (limit !== itemsPerPage) {
      setParam('limit', itemsPerPage);
    }
  }, [itemsPerPage]);

  return { currentPage: safePage, setCurrentPage, totalPages, paginatedItems, startIndex, endIndex, resetPage };
}
