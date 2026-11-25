import { useState } from 'react';
import { api } from '../../services/api.js';
import Field from '../Field.jsx';
import FormFooter from '../FormFooter.jsx';

// Owner adds staff accounts, renames them, changes roles, turns accounts off, resets passwords
export default function UserForm({ item, me, onSaved, onClose }) {
  const isSelf = item?.id === me.id;
  const [form, setForm] = useState({
    name: item?.name ?? '',
    username: item?.username ?? '',
    role: item?.role ?? 'staff',
    active: item?.active ?? true,
    password: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault();
    setError('');
    const name = form.name.trim();
    if (!name) return setError('Enter a name.');
    if ((!item || form.password) && form.password.length < 8) return setError('The password must be at least 8 characters.');

    let body;
    if (!item) {
      body = { name, username: form.username.trim(), password: form.password, role: form.role };
    } else {
      body = {};
      if (name !== item.name) body.name = name;
      if (form.role !== item.role) body.role = form.role;
      if (form.active !== item.active) body.active = form.active;
      if (form.password) body.password = form.password;
      if (!Object.keys(body).length) return onClose();
    }

    setSaving(true);
    try {
      if (item) await api.update('users', item.id, body);
      else await api.create('users', body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="modalform">
      <Field label="Full name *"><input required autoFocus value={form.name} onChange={set('name')} placeholder="Ana Cruz" /></Field>
      <Field label="Username *">
        <input
          required
          value={form.username}
          onChange={set('username')}
          disabled={Boolean(item)}
          autoComplete="off"
          placeholder="ana"
        />
      </Field>
      <div className="formrow">
        <Field label="Role">
          <select value={form.role} onChange={set('role')} disabled={isSelf}>
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </Field>
        {item && (
          <Field label="Account">
            <label className="checkrow">
              <input type="checkbox" checked={form.active} onChange={set('active')} disabled={isSelf} />
              {form.active ? 'Can log in' : 'Turned off'}
            </label>
          </Field>
        )}
      </div>
      <p className="hint">
        {form.role === 'owner'
          ? 'Owners can do everything, including prices, deleting records and managing staff.'
          : 'Staff can add customers and orders and move orders forward. They cannot change prices or delete.'}
        {isSelf && ' You cannot change your own role or turn off your own account.'}
      </p>
      <Field label={item ? 'New password (leave empty to keep the current one)' : 'Password *'}>
        <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" />
      </Field>
      {item && !isSelf && form.password && <p className="hint">They will be logged out and must use the new password.</p>}
      {error && <p className="warning" role="alert">{error}</p>}
      <FormFooter onClose={onClose} saving={saving} label={item ? 'Save changes' : 'Create account'} />
    </form>
  );
}
