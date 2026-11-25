import { useState } from 'react';
import { Search, Shirt } from 'lucide-react';
import Empty from '../components/Empty.jsx';
import RowActions from '../components/RowActions.jsx';
import { peso } from '../utils/format.js';

// Everyone sees the price list; only the owner can change it
export default function Services({ services, listsLoading, isOwner, open, remove }) {
  const [search, setSearch] = useState('');
  const term = search.toLowerCase();
  const visible = services.filter((s) => `${s.name} ${s.detail}`.toLowerCase().includes(term));

  return (
    <section className="panel">
      <div className="listtoolbar">
        <div className="search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." aria-label="Search services" />
        </div>
        {!isOwner && <span className="hint">Only the owner can change prices.</span>}
      </div>
      <div className="servicegrid">
        {visible.map((s) => (
          <div className="servicecard" key={s.id}>
            <div className="serviceicon"><Shirt size={22} /></div>
            {isOwner && (
              <div className="serviceactions">
                <RowActions onEdit={() => open('service', s)} onDelete={() => remove('services', s, s.name)} />
              </div>
            )}
            <h3>{s.name}</h3>
            <p>{s.detail || 'Laundry service'}</p>
            <div className="serviceprice"><strong>{peso(s.price)}</strong><span>/ kg</span></div>
          </div>
        ))}
        {listsLoading ? (
          <div className="empty"><span>Loading services...</span></div>
        ) : (
          visible.length === 0 && <Empty text={search ? 'No services match your search.' : 'Add a service to get started.'} />
        )}
      </div>
    </section>
  );
}
