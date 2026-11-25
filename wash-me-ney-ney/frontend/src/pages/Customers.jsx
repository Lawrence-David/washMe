import { useState } from 'react';
import { Search } from 'lucide-react';
import Empty from '../components/Empty.jsx';
import RowActions from '../components/RowActions.jsx';

export default function Customers({ customers, listsLoading, isOwner, open, remove }) {
  const [search, setSearch] = useState('');
  const term = search.toLowerCase();
  const visible = customers.filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(term));

  return (
    <section className="panel">
      <div className="listtoolbar">
        <div className="search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." aria-label="Search customers" />
        </div>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>Customer name</th><th>Phone number</th><th>Email</th><th>Orders</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {visible.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="customername">
                    <span className="initial">{c.name[0]?.toUpperCase()}</span>
                    <strong>{c.name}</strong>
                  </div>
                </td>
                <td>{c.phone || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.orderCount ?? 0}</td>
                <td>
                  <RowActions
                    onEdit={() => open('customer', c)}
                    // Customers with orders are kept for the records
                    onDelete={isOwner && !c.orderCount ? () => remove('customers', c, c.name) : null}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listsLoading ? (
          <div className="empty"><span>Loading customers...</span></div>
        ) : (
          visible.length === 0 && <Empty text={search ? 'No customers match your search.' : 'Add a customer to get started.'} />
        )}
      </div>
    </section>
  );
}
