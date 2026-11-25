import { useState } from 'react';
import { api } from '../../services/api.js';
import Field from '../Field.jsx';
import FormFooter from '../FormFooter.jsx';

export default function CustomerForm({ item, onSaved, onClose }) {
  const [form, setForm] = useState({ name: item?.name ?? '', phone: item?.phone ?? '', email: item?.email ?? '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setError('');
    const body = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() };
    if (!body.name) return setError('Enter the customer name.');
    setSaving(true);
    try {
      if (item) await api.update('customers', item.id, body);
      else await api.create('customers', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="modalform">
      <Field label="Full name *"><input required autoFocus value={form.name} onChange={set('name')} placeholder="Juan Dela Cruz" /></Field>
      <Field label="Phone number"><input value={form.phone} onChange={set('phone')} placeholder="09XX XXX XXXX" /></Field>
      <Field label="Email address"><input type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" /></Field>
      {error && <p className="warning" role="alert">{error}</p>}
      <FormFooter onClose={onClose} saving={saving} label={item ? 'Save changes' : 'Create customer'} />
    </form>
  );
}
