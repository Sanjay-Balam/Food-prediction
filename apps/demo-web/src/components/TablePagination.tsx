"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check } from "lucide-react";

interface TablePaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 80, 100],
}: TablePaginationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate pagination items with ellipses matching user specification
  const pageNumbers: (number | "ellipsis")[] = React.useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Page Size Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-mono font-semibold transition-all cursor-pointer shadow-sm ${
            isOpen
              ? "border-[#B88E3E] ring-2 ring-[#B88E3E]/20 text-[#8F6D27]"
              : "border-[#EADDCE] text-[#8F6D27] hover:border-[#B88E3E]"
          }`}
          aria-label="Select items per page"
        >
          <span>{pageSize}</span>
          {isOpen ? (
            <ChevronUp className="size-3.5 text-[#8F6D27]" />
          ) : (
            <ChevronDown className="size-3.5 text-[#71717A]" />
          )}
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-1.5 left-0 z-50 w-24 rounded-xl border border-[#EADDCE] bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95">
            {pageSizeOptions.map((opt) => {
              const isSelected = opt === pageSize;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onPageSizeChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF5EA] text-[#8F6D27] font-bold"
                      : "text-[#52525B] hover:bg-[#FAF8F5] hover:text-[#18181B]"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="size-3.5 text-[#B88E3E]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Previous Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#EADDCE] bg-white text-[#52525B] hover:text-[#18181B] hover:border-[#B88E3E] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#EADDCE] disabled:hover:bg-white transition-all shadow-sm cursor-pointer"
        aria-label="Previous Page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {/* Numbered Page Buttons */}
      {pageNumbers.map((page, i) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${i}`}
              className="w-8 h-9 flex items-center justify-center text-[#71717A] text-sm font-bold tracking-widest"
            >
              •••
            </span>
          );
        }
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 px-2.5 flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isActive
                ? "bg-[#B88E3E] text-white shadow-[#B88E3E]/20"
                : "border border-[#EADDCE] bg-white text-[#52525B] hover:text-[#18181B] hover:border-[#B88E3E] hover:bg-[#FAF8F5]"
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Page Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#EADDCE] bg-white text-[#52525B] hover:text-[#18181B] hover:border-[#B88E3E] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#EADDCE] disabled:hover:bg-white transition-all shadow-sm cursor-pointer"
        aria-label="Next Page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
