"use client";

import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import type { AdminUsersPagination } from "../../lib/admin-users";

type AdminPaginationProps = {
  pagination: AdminUsersPagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

function getVisiblePages(currentPage: number, lastPage: number) {
  const pages = new Set<number>([1, lastPage, currentPage]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < lastPage) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((left, right) => left - right);
}

export default function AdminPagination({
  pagination,
  onPageChange,
  disabled = false,
}: AdminPaginationProps) {
  if (pagination.last_page <= 1) {
    return null;
  }

  const pages = getVisiblePages(
    pagination.current_page,
    pagination.last_page
  );

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
      <p className="text-sm text-[#8ea4b3]">
        صفحه {pagination.current_page} از {pagination.last_page}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="صفحه قبل"
          disabled={disabled || pagination.current_page <= 1}
          onClick={() => onPageChange(pagination.current_page - 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition enabled:hover:border-white/20 enabled:hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <HiOutlineChevronRight className="h-5 w-5" />
        </button>

        {pages.map((page, index) => {
          const previousPage = pages[index - 1];
          const shouldShowGap = previousPage && page - previousPage > 1;

          return (
            <div key={page} className="flex items-center gap-2">
              {shouldShowGap ? (
                <span className="px-1 text-sm text-[#6f8594]">...</span>
              ) : null}
              <button
                type="button"
                aria-label={`صفحه ${page}`}
                aria-current={
                  page === pagination.current_page ? "page" : undefined
                }
                disabled={disabled}
                onClick={() => onPageChange(page)}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-2xl px-3 text-sm transition ${
                  page === pagination.current_page
                    ? "bg-[#f5c518] font-semibold text-black"
                    : "border border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                }`}
              >
                {page}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          aria-label="صفحه بعد"
          disabled={disabled || pagination.current_page >= pagination.last_page}
          onClick={() => onPageChange(pagination.current_page + 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition enabled:hover:border-white/20 enabled:hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <HiOutlineChevronLeft className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
