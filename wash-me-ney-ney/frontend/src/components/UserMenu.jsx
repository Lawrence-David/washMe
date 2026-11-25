import { useEffect, useRef, useState } from 'react';
import { ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { initials } from '../utils/format.js';

// Avatar button in the top bar: shows who is logged in, with Change password and Log out
export default function UserMenu({ user, onChangePassword, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const pick = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="usermenu" ref={ref}>
      <button type="button" className="usermenubtn" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
        <span className="avatar">{initials(user.name)}</span>
        <span className="usermeta">
          <b>{user.name}</b>
          <small>{user.role === 'owner' ? 'Owner' : 'Staff'}</small>
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menuhead">
            <b>{user.name}</b>
            <small>@{user.username}</small>
          </div>
          <button type="button" role="menuitem" onClick={pick(onChangePassword)}><KeyRound size={16} /> Change password</button>
          <button type="button" role="menuitem" className="danger" onClick={pick(onLogout)}><LogOut size={16} /> Log out</button>
        </div>
      )}
    </div>
  );
}
