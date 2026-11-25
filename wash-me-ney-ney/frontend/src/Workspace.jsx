import { useCallback, useEffect, useState } from 'react';
import { Menu, Plus, Sparkles } from 'lucide-react';
import { api } from './services/api.js';
import { NAV, REFRESH_MS } from './constants';
import Modal from './components/Modal.jsx';
import UserMenu from './components/UserMenu.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Customers from './pages/Customers.jsx';
import Services from './pages/Services.jsx';
import Staff from './pages/Staff.jsx';
import OrderForm from './components/forms/OrderForm.jsx';
import CustomerForm from './components/forms/CustomerForm.jsx';
import ServiceForm from './components/forms/ServiceForm.jsx';
import UserForm from './components/forms/UserForm.jsx';
import PasswordForm from './components/forms/PasswordForm.jsx';

const PAGE_INFO = {
  orders: { text: 'Track, organize and update laundry orders.', add: 'Order', modal: 'order' },
  customers: { text: 'Keep your customers close and their details handy.', add: 'Customer', modal: 'customer' },
  services: { text: 'Manage your laundry packages and pricing.', add: 'Service', modal: 'service', ownerOnly: true },
  staff: { text: 'Give each person their own login. Turn accounts off when someone leaves.', add: 'Staff', modal: 'user', ownerOnly: true },
};

const MODAL_TITLES = {
  order: (item) => (item ? `Edit Order ${item.code}` : 'New Laundry Order'),
  customer: (item) => `${item ? 'Edit' : 'Add'} Customer`,
  service: (item) => `${item ? 'Edit' : 'Add'} Service`,
  user: (item) => (item ? `Edit ${item.name}` : 'Add Staff Account'),
  password: () => 'Change Password',
};

export default function Workspace({ user, onLogout, onUserChanged }) {
  const isOwner = user.role === 'owner';
  const nav = NAV.filter((n) => !n.ownerOnly || isOwner);

  const [page, setPage] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0); // bumped to make pages reload their order data
  const [modal, setModal] = useState(null); // { type, item }

  const loadLists = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([api.list('customers'), api.list('services')]);
      setCustomers(c);
      setServices(s);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    }
    setListsLoading(false);
  }, []);

  const refresh = useCallback(() => {
    loadLists();
    setVersion((v) => v + 1);
  }, [loadLists]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Keep data fresh when several people use the app: reload every 30s and when the tab regains focus
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const id = setInterval(tick, REFRESH_MS);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, [refresh]);

  const customerName = (id) => customers.find((c) => c.id === id)?.name || 'Unknown customer';
  const serviceName = (id) => services.find((s) => s.id === id)?.name || 'Deleted service';
  const open = (type, item = null) => setModal({ type, item });
  const close = () => setModal(null);
  const saved = () => {
    setModal(null);
    refresh();
  };

  async function remove(resource, item, label) {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await api.remove(resource, item.id);
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  function navigate(to) {
    setPage(to);
    setMobileNav(false);
  }

  const shared = { user, isOwner, customers, services, customerName, serviceName, version, open, remove, navigate, listsLoading };
  const info = PAGE_INFO[page];
  const current = nav.find((n) => n.id === page);

  return (
    <div className="app">
      <aside className={'sidebar ' + (mobileNav ? 'show' : '')}>
        <div className="brand">
          <img className="brandlogo" src="/brand/wash-me-ney-ney-logo.png" alt="Wash Me Ney Ney logo" />
          <div>
            <strong>wash me<br />ney ney<span className="branddot">.</span></strong>
            <small>LAUNDRY MANAGEMENT</small>
          </div>
        </div>
        <p className="navlabel">WORKSPACE</p>
        <nav>
          {nav.map((n) => (
            <button key={n.id} className={'navitem ' + (page === n.id ? 'selected' : '')} onClick={() => navigate(n.id)}>
              <n.icon size={19} />
              {n.label}
              {page === n.id && <span className="navdot" />}
            </button>
          ))}
        </nav>
        <div className="sidebarbottom">
          <div className="tip">
            <Sparkles size={18} />
            <b>Fresh starts here!</b>
            <span>Keep your laundry business running smoothly.</span>
          </div>
        </div>
      </aside>
      {mobileNav && <button className="navbackdrop" onClick={() => setMobileNav(false)} aria-label="Close menu" />}

      <main className="main">
        <header className="topbar">
          <button className="iconbtn mobilemenu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>{current?.label}</b></div>
          <div className="topright">
            <UserMenu user={user} onChangePassword={() => open('password')} onLogout={onLogout} />
          </div>
        </header>

        <div className="content">
          {loadError && (
            <div className="note">
              <span><b>Couldn't load data:</b> {loadError} <button className="secondary" onClick={refresh}>Retry</button></span>
            </div>
          )}

          {page === 'dashboard' && <Dashboard {...shared} />}

          {info && (
            <>
              <section className="pagetitle">
                <div>
                  <p className="eyebrow">WASH ME NEY NEY / WORKSPACE</p>
                  <h1>{current?.label}</h1>
                  <p>{info.text}</p>
                </div>
                {(!info.ownerOnly || isOwner) && (
                  <button className="primary" onClick={() => open(info.modal)}><Plus size={17} /> Add {info.add}</button>
                )}
              </section>
              {page === 'orders' && <Orders {...shared} />}
              {page === 'customers' && <Customers {...shared} />}
              {page === 'services' && <Services {...shared} />}
              {page === 'staff' && isOwner && <Staff {...shared} />}
            </>
          )}

          <footer>Made with care & bubbles 🫧 &nbsp;·&nbsp; Wash Me Ney Ney &nbsp;·&nbsp; Laundry Management</footer>
        </div>
      </main>

      {modal && (
        <Modal title={MODAL_TITLES[modal.type](modal.item)} onClose={close}>
          {modal.type === 'order' && (
            <OrderForm order={modal.item} customers={customers} services={services} role={user.role} onSaved={saved} onClose={close} />
          )}
          {modal.type === 'customer' && <CustomerForm item={modal.item} onSaved={saved} onClose={close} />}
          {modal.type === 'service' && <ServiceForm item={modal.item} onSaved={saved} onClose={close} />}
          {modal.type === 'user' && (
            <UserForm
              item={modal.item}
              me={user}
              onSaved={() => {
                if (modal.item?.id === user.id) onUserChanged();
                saved();
              }}
              onClose={close}
            />
          )}
          {modal.type === 'password' && <PasswordForm onClose={close} />}
        </Modal>
      )}
    </div>
  );
}
