import { LayoutDashboard, ShoppingBag, Users, Layers, UserCog } from 'lucide-react';

export const STATUSES = ['Pending', 'In Progress', 'Ready', 'Completed', 'Cancelled'];
export const PAYMENTS = ['Unpaid', 'Paid', 'Refunded'];

// ownerOnly pages are hidden from staff (the API also refuses them)
export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'services', label: 'Services', icon: Layers },
  { id: 'staff', label: 'Staff', icon: UserCog, ownerOnly: true },
];

export const PAGE_SIZE = 20;
export const REFRESH_MS = 30000; // reload data every 30s so staff see each other's changes
