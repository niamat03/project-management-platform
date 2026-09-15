import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationProps {
  page: number
  count: number
  pageSize: number
  hasNext: boolean
  hasPrevious: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, count, pageSize, hasNext, hasPrevious, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <p>
        {from}–{to} of {count}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Previous
        </button>
        <span className="px-2 text-xs text-slate-400">Page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
