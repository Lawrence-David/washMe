import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { api } from '../services/api.js';
import Field from '../components/Field.jsx';

export default function Login({ notice, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) return setError('Enter your username and password.');
    setBusy(true);
    try {
      onLogin(await api.login(username.trim(), password));
    } catch (err) {
      setError(err.message);
      setPassword('');
    }
    setBusy(false);
  }

  return (
    <main className="loginpage">
      <section className="logincard">
        <div className="brand loginbrand">
          <img className="brandlogo" src="/brand/wash-me-ney-ney-logo.png" alt="Wash Me Ney Ney logo" />
          <div>
            <strong>wash me<br />ney ney<span className="branddot">.</span></strong>
            <small>LAUNDRY MANAGEMENT</small>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p className="loginlead">Log in to manage today's laundry.</p>
        {notice && !error && <p className="loginnotice">{notice}</p>}
        <form onSubmit={submit} className="loginform">
          <Field label="Username">
            <input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Password">
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="warning" role="alert">{error}</p>}
          <button type="submit" className="primary loginbtn" disabled={busy}>
            <LogIn size={17} /> {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="loginfoot">Forgot your password? Ask the shop owner to reset it.</p>
      </section>
    </main>
  );
}
