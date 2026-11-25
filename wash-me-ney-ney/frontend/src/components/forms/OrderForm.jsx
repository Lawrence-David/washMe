import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../../services/api.js';
import { peso, dateTime } from '../../utils/format.js';
import { isLocked, statusOptions, paymentOptions, finalStateError } from '../../constants/orderRules.js';
import Field from '../Field.jsx';
import FormFooter from '../FormFooter.jsx';

// New order, or open an existing one. For an existing order the latest copy (with its
// activity log) is fetched first, so the rules are checked against fresh data.
export default function OrderForm({ order, ...rest }) {
  const [full, setFull] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order) return;
    let alive = true;
    api
      .get('orders', order.id)
      .then((o) => alive && setFull(o))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [order]);

  if (!order) return <OrderFormBody order={null} {...rest} />;
  if (error) return <div className="modalform"><p className="warning">{error}</p></div>;
  if (!full) return <div className="modalform"><p className="hint">Loading order...</p></div>;
  return <OrderFormBody order={full} {...rest} />;
}

const HISTORY_LABELS = { status: 'Status', payment: 'Payment', weight: 'Weight', service: 'Service', customer: 'Customer' };

function OrderFormBody({ order, customers, services, role, onSaved, onClose }) {
  const editing = Boolean(order);
  const [form, setForm] = useState(
    editing
      ? { customerId: order.customerId, serviceId: order.serviceId, weight: String(order.weight), status: order.status, payment: order.payment }
      : { customerId: '', serviceId: '', weight: '1', status: 'Pending', payment: 'Unpaid' }
  );
  const [refundChoice, setRefundChoice] = useState(''); // '' | 'Refunded' | 'Paid'
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const locked = editing && isLocked(order);
  const statusChoices = editing ? statusOptions(order.status, role) : ['Pending'];
  const paymentChoices = editing ? paymentOptions(order.payment, form.status, role) : ['Unpaid', 'Paid'];
  // Cancelling a paid order: someone has to decide what happens to the money
  const decidingRefund = editing && order.payment === 'Paid' && order.status !== 'Cancelled' && form.status === 'Cancelled';
  const nextPayment = decidingRefund ? refundChoice || 'Paid' : form.payment;
  const ruleProblem = finalStateError({ status: form.status, payment: nextPayment });

  const service = services.find((s) => s.id === form.serviceId);
  const keepsOldPrice = editing && form.serviceId === order.serviceId;
  const pricePerKg = keepsOldPrice ? order.price : service?.price ?? 0;
  const total = Number(form.weight || 0) * pricePerKg;

  function changeStatus(status) {
    // If the current payment choice isn't valid for the new status, go back to the saved one
    const allowed = paymentOptions(order?.payment ?? 'Unpaid', status, role);
    setForm({ ...form, status, payment: allowed.includes(form.payment) ? form.payment : order?.payment ?? 'Unpaid' });
    setRefundChoice('');
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    const weight = Number(form.weight);
    if (!form.customerId || !form.serviceId) return setError('Choose a customer and a service.');
    if (!Number.isFinite(weight) || weight < 0.1 || weight > 1000) return setError('Weight must be between 0.1 and 1000 kg.');
    if (decidingRefund && !refundChoice) return setError('Choose whether to refund the customer or keep the payment.');
    if (ruleProblem) return setError(ruleProblem);

    let body;
    if (!editing) {
      body = { customerId: form.customerId, serviceId: form.serviceId, weight, payment: form.payment };
    } else {
      // Send only what changed
      body = {};
      if (form.customerId !== order.customerId) body.customerId = form.customerId;
      if (form.serviceId !== order.serviceId) body.serviceId = form.serviceId;
      if (weight !== order.weight) body.weight = weight;
      if (form.status !== order.status) body.status = form.status;
      if (decidingRefund || nextPayment !== order.payment) body.payment = nextPayment;
      if (!Object.keys(body).length) return onClose();
    }

    setSaving(true);
    try {
      if (editing) await api.update('orders', order.id, body);
      else await api.create('orders', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <form onSubmit={save} className="modalform">
      {locked && (
        <p className="lockednote">
          <Lock size={15} />
          <span>
            This order is {order.payment !== 'Unpaid' ? order.payment.toLowerCase() : order.status.toLowerCase()}, so its customer,
            service and weight are locked.{role === 'owner' && ' To correct them, set Payment back to Unpaid first.'}
          </span>
        </p>
      )}

      <Field label="Customer *">
        <select required value={form.customerId} onChange={set('customerId')} disabled={locked}>
          <option value="">Select customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Service *">
        <select required value={form.serviceId} onChange={set('serviceId')} disabled={locked}>
          <option value="">Select service</option>
          {services.map((s) =>
            editing && s.id === order.serviceId && s.price !== order.price ? (
              // The order keeps the price it was made with, even if the price list changed since
              <option key={s.id} value={s.id}>{s.name} — {peso(order.price)}/kg (price when ordered)</option>
            ) : (
              <option key={s.id} value={s.id}>{s.name} — {peso(s.price)}/kg</option>
            )
          )}
        </select>
      </Field>
      <Field label="Weight (kg) *">
        <input required type="number" min="0.1" max="1000" step="0.1" value={form.weight} onChange={set('weight')} disabled={locked} />
      </Field>

      <div className="formrow">
        <Field label="Order status">
          <select value={form.status} onChange={(e) => changeStatus(e.target.value)} disabled={!editing}>
            {statusChoices.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        {!decidingRefund && (
          <Field label="Payment">
            <select value={form.payment} onChange={set('payment')} disabled={paymentChoices.length < 2}>
              {paymentChoices.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        )}
      </div>
      {!editing && <p className="hint">New orders start as Pending. Mark them Paid if the customer pays upfront.</p>}

      {decidingRefund && (
        <fieldset className="choice">
          <legend>This order was paid. What happens to the {peso(order.weight * order.price)}?</legend>
          <label className={refundChoice === 'Refunded' ? 'picked' : ''}>
            <input type="radio" name="refund" checked={refundChoice === 'Refunded'} onChange={() => setRefundChoice('Refunded')} />
            <span><b>Refund the customer</b><small>Not counted in the paid total</small></span>
          </label>
          <label className={refundChoice === 'Paid' ? 'picked' : ''}>
            <input type="radio" name="refund" checked={refundChoice === 'Paid'} onChange={() => setRefundChoice('Paid')} />
            <span><b>Keep the payment</b><small>Still counted in the paid total</small></span>
          </label>
        </fieldset>
      )}

      {ruleProblem && !decidingRefund && <p className="warning">{ruleProblem}</p>}

      <div className="pricepreview">
        <span>{keepsOldPrice ? 'Order total' : 'Estimated total'}<small>{form.weight || 0} kg × {peso(pricePerKg)}</small></span>
        <strong>{peso(total)}</strong>
      </div>
      {(customers.length === 0 || services.length === 0) && <p className="warning">Create a customer and service before adding an order.</p>}
      {error && <p className="warning" role="alert">{error}</p>}

      <FormFooter
        onClose={onClose}
        saving={saving}
        label={editing ? 'Save changes' : 'Create order'}
        disabled={Boolean(ruleProblem) || (decidingRefund && !refundChoice)}
      />

      {editing && order.history?.length > 0 && (
        <section className="history">
          <h3>Activity</h3>
          <ol>
            {[...order.history].reverse().map((h, i) => (
              <li key={i}>
                <span className="historywhen">{dateTime(h.at)} · {h.byName}</span>
                <span>
                  {h.action === 'created' ? 'Created the order' : `${HISTORY_LABELS[h.action] ?? h.action}: ${h.from} → ${h.to}`}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </form>
  );
}
