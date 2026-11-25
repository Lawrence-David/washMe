import Badge from './Badge.jsx';
import Empty from './Empty.jsx';
import RowActions from './RowActions.jsx';
import { peso } from '../utils/format.js';

export default function OrderTable({ orders, loading, customerName, serviceName, isOwner, open, remove, emptyText }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th><th>Customer</th><th>Service</th><th>Amount</th><th>Status</th><th>Payment</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><strong>{o.code}</strong><small>{o.date}</small></td>
              <td>{customerName(o.customerId)}</td>
              <td>{serviceName(o.serviceId)}<small>{o.weight} kg × {peso(o.price)}</small></td>
              <td className={'strong' + (o.payment === 'Refunded' ? ' refunded' : '')}>{peso(o.weight * o.price)}</td>
              <td><Badge>{o.status}</Badge></td>
              <td><Badge>{o.payment}</Badge></td>
              <td>
                <RowActions
                  editLabel="Open order"
                  onEdit={() => open('order', o)}
                  // Only the owner deletes, and paid orders are kept for the records
                  onDelete={isOwner && o.payment !== 'Paid' ? () => remove('orders', o, `order ${o.code}`) : null}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading ? (
        <div className="empty"><span>Loading orders...</span></div>
      ) : (
        orders.length === 0 && <Empty text={emptyText} />
      )}
    </div>
  );
}
