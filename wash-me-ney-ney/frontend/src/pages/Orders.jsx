import { useEffect, useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { api } from '../services/api.js';
import { useApi, useDebounced } from '../hooks/useApi.js';
import { STATUSES, PAGE_SIZE } from '../constants';
import OrderTable from '../components/OrderTable.jsx';
import Pagination from '../components/Pagination.jsx';

// Search, filters and paging all happen on the server, so this stays fast with thousands of orders
export default function Orders(props) {
  const { version } = props;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim());

  // Back to page 1 whenever the filters change
  useEffect(() => setPage(1), [q, status, from, to]);

  const res = useApi(
    () => api.list('orders', { page, limit: PAGE_SIZE, q, status, from, to }),
    [page, q, status, from, to, version]
  );
  const data = res.data;

  // If the last order on the last page was deleted, step back a page
  useEffect(() => {
    if (data && page > data.pages) setPage(data.pages);
  }, [data, page]);

  const filtered = q || status || from || to;
  const clear = () => {
    setSearch('');
    setStatus('');
    setFrom('');
    setTo('');
  };

  return (
    <section className="panel">
      <div className="listtoolbar">
        <div className="search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, customer or service..." aria-label="Search orders" />
        </div>
        <div className="filters">
          <div className="selectwrap">
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
          <label className="datefilter">From <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="datefilter">To <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
          {filtered && <button className="secondary" onClick={clear}><X size={15} /> Clear</button>}
        </div>
      </div>
      {res.error && <p className="warning listerror">{res.error}</p>}
      <OrderTable
        {...props}
        orders={data?.items ?? []}
        loading={!data && !res.error}
        emptyText={filtered ? 'No orders match these filters.' : 'Try adding an order.'}
      />
      {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
    </section>
  );
}
