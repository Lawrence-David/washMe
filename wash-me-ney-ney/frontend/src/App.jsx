import { useEffect, useState } from 'react';
import { api, setUnauthorizedHandler } from './services/api.js';
import Login from './pages/Login.jsx';
import Workspace from './Workspace.jsx';

// Decides between the login page and the app, based on who is logged in
function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = logged out
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // Any request that comes back 401 (expired login, account turned off) returns to the login page
    setUnauthorizedHandler((message) => {
      setUser(null);
      setNotice(message || 'Your session has ended. Please log in again.');
    });
    api
      .me()
      .then(setUser)
      .catch((err) => {
        setUser(null);
        if (err.status !== 401) setNotice(err.message);
      });
  }, []);

  async function logout() {
    try {
      await api.logout();
    } catch {
      // Even if the server can't be reached, leave the app
    }
    setUser(null);
    setNotice('You have logged out.');
  }

  if (user === undefined) return <div className="splash">Loading...</div>;
  if (!user) {
    return (
      <Login
        notice={notice}
        onLogin={(u) => {
          setNotice('');
          setUser(u);
        }}
      />
    );
  }
  return <Workspace key={user.id} user={user} onLogout={logout} onUserChanged={() => api.me().then(setUser).catch(() => {})} />;
}

export default App;
