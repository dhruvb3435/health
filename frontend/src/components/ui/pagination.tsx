import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    total?: number;
    limit?: number;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    total,
    limit
}: PaginationProps) {
    if (totalPages <= 1 && total === undefined) return null;

    const getPages = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);

            if (end === totalPages) {
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-slate-50/50 border-t border-slate-100">
            <div className="text-sm text-slate-500">
                {total !== undefined && limit !== undefined ? (
                    <>
                        Showing <span className="font-semibold text-slate-900">{Math.min(total, (currentPage - 1) * limit + 1)}</span> to{' '}
                        <span className="font-semibold text-slate-900">{Math.min(total, currentPage * limit)}</span> of{' '}
                        <span className="font-semibold text-slate-900">{total}</span> results
                    </>
                ) : (
                    <>Page <span className="font-semibold text-slate-900">{currentPage}</span> of <span className="font-semibold text-slate-900">{totalPages}</span></>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
                    title="First Page"
                >
                    <ChevronsLeft size={18} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
                    title="Previous Page"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1 mx-2">
                    {getPages().map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[32px] h-8 rounded-md text-sm font-medium transition-all ${currentPage === page
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
                    title="Next Page"
                >
                    <ChevronRight size={18} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
                    title="Last Page"
                >
                    <ChevronsRight size={18} />
                </button>
            </div>
        </div>
    );
}
