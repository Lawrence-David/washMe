import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';
import Field from '../Field.jsx';
import FormFooter from '../FormFooter.jsx';

export default function PasswordForm({ onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setError('');
    if (form.next.length < 8) return setError('The new password must be at least 8 characters.');
    if (form.next !== form.confirm) return setError("The new passwords don't match.");
    setSaving(true);
    try {
      await api.changePassword(form.current, form.next);
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  if (done) {
    return (
      <div className="modalform">
        <p className="success"><CheckCircle2 size={18} /> Password changed. Other devices using your account were logged out.</p>
        <div className="modalfooter"><button type="button" className="primary" onClick={onClose}>Done</button></div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="modalform">
      <Field label="Current password"><input type="password" autoFocus autoComplete="current-password" value={form.current} onChange={set('current')} /></Field>
      <Field label="New password"><input type="password" autoComplete="new-password" value={form.next} onChange={set('next')} placeholder="At least 8 characters" /></Field>
      <Field label="Repeat new password"><input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></Field>
      {error && <p className="warning" role="alert">{error}</p>}
      <FormFooter onClose={onClose} saving={saving} label="Change password" />
    </form>
  );
}
