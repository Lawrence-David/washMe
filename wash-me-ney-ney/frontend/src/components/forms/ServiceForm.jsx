import { useState } from 'react';
import { api } from '../../services/api.js';
import Field from '../Field.jsx';
import FormFooter from '../FormFooter.jsx';

export default function ServiceForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({ name: item?.name ?? '', price: item?.price ?? '', detail: item?.detail ?? '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setError('');
    const name = form.name.trim();
    const price = Number(form.price);
    if (!name) return setError('Enter the service name.');
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setError('Enter a price of ₱0 or more.');
    setSaving(true);
    try {
      const body = { name, price, detail: form.detail.trim() };
      if (item) await api.update('services', item.id, body);
      else await api.create('services', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="modalform">
      <Field label="Service name *"><input required autoFocus value={form.name} onChange={set('name')} placeholder="Wash & Fold" /></Field>
      <Field label="Price per kg (₱) *"><input type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} /></Field>
      <Field label="Description"><input value={form.detail} onChange={set('detail')} placeholder="What does this service include?" /></Field>
      {item && <p className="hint">Changing the price only affects new orders. Existing orders keep the price they were made with.</p>}
      {error && <p className="warning" role="alert">{error}</p>}
      <FormFooter onClose={onClose} saving={saving} label={item ? 'Save changes' : 'Create service'} />
    </form>
  );
}
