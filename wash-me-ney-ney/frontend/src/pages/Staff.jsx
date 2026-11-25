import { api } from '../services/api.js';
import { useApi } from '../hooks/useApi.js';
import Empty from '../components/Empty.jsx';
import RowActions from '../components/RowActions.jsx';
import { initials } from '../utils/format.js';

// Owner only: everyone who can log in
export default function Staff({ user, version, open }) {
  const res = useApi(() => api.list('users'), [version]);
  const users = res.data ?? [];

  return (
    <section className="panel">
      {res.error && <p className="warning listerror">{res.error}</p>}
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.active ? '' : 'inactive'}>
                <td>
                  <div className="customername">
                    <span className="initial">{initials(u.name)}</span>
                    <strong>{u.name}{u.id === user.id && <span className="you"> (you)</span>}</strong>
                  </div>
                </td>
                <td>@{u.username}</td>
                <td><span className={'rolepill ' + u.role}>{u.role === 'owner' ? 'Owner' : 'Staff'}</span></td>
                <td><span className={'badge ' + (u.active ? 'badge-ready' : 'badge-cancelled')}>{u.active ? 'Active' : 'Turned off'}</span></td>
                <td><RowActions onEdit={() => open('user', u)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!res.data && !res.error ? (
          <div className="empty"><span>Loading staff...</span></div>
        ) : (
          users.length === 0 && <Empty text="Add a staff account to get started." />
        )}
      </div>
    </section>
  );
}
