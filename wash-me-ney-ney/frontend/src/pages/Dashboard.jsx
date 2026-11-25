import { ShoppingBag, Plus, CheckCircle2, Clock3, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useApi } from '../hooks/useApi.js';
import { peso } from '../utils/format.js';
import OrderTable from '../components/OrderTable.jsx';

export default function Dashboard(props) {
  const { user, version, open, navigate } = props;
  const stats = useApi(() => api.orderStats(), [version]);
  const latest = useApi(() => api.list('orders', { limit: 5 }), [version]);
  const s = stats.data ?? { total: 0, active: 0, completed: 0, readyUnpaid: 0, revenue: 0 };
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR LAUNDRY, SIMPLIFIED ✨</p>
          <h1>Hey {firstName}, welcome back!</h1>
          <p>Here's what's happening at Wash Me Ney Ney today.</p>
          <button className="primary light" onClick={() => open('order')}><Plus size={17} /> New laundry order</button>
        </div>
        <div className="welcomeart brand-hero">
          <img src="/brand/wash-me-ney-ney-logo.png" alt="Wash Me Ney Ney washing machine brand logo" />
        </div>
      </section>

      {stats.error && <div className="note"><span><b>Couldn't load totals:</b> {stats.error}</span></div>}

      <div className="stats">
        <div className="stat">
          <div className="stathead"><span>Total Orders</span><span className="staticon blue"><ShoppingBag size={19} /></span></div>
          <strong>{stats.data ? s.total : '–'}</strong>
          <small>All-time orders</small>
        </div>
        <div className="stat">
          <div className="stathead"><span>In Progress</span><span className="staticon yellow"><Clock3 size={19} /></span></div>
          <strong>{stats.data ? s.active : '–'}</strong>
          <small>{s.readyUnpaid ? `${s.readyUnpaid} ready but not paid yet` : 'Orders needing attention'}</small>
        </div>
        <div className="stat">
          <div className="stathead"><span>Completed</span><span className="staticon green"><CheckCircle2 size={19} /></span></div>
          <strong>{stats.data ? s.completed : '–'}</strong>
          <small>Paid and picked up</small>
        </div>
        <div className="stat">
          <div className="stathead"><span>Paid Orders Total</span><span className="staticon purple"><ArrowUpRight size={19} /></span></div>
          <strong className="money">{stats.data ? peso(s.revenue) : '–'}</strong>
          <small>Payments kept (refunds excluded)</small>
        </div>
      </div>

      <section className="panel">
        <div className="panelhead">
          <div>
            <h2>Recent Orders</h2>
            <p>Keep an eye on your latest laundry requests.</p>
          </div>
          <button className="secondary" onClick={() => navigate('orders')}>View all orders <ArrowUpRight size={16} /></button>
        </div>
        <OrderTable
          {...props}
          orders={latest.data?.items ?? []}
          loading={!latest.data && !latest.error}
          emptyText={latest.error || 'Add your first laundry order to see it here.'}
        />
      </section>
    </>
  );
}
