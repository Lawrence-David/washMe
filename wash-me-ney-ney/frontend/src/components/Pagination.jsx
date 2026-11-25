import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, limit, onPage }) {
  if (!total) return null;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  return (
    <div className="pagination">
      <span>Showing {first}–{last} of {total}</span>
      <div className="pagebtns">
        <button className="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="pagenum">Page {page} of {pages}</span>
        <button className="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
