# Wash Me Ney Ney 🫧

Laundry shop management app: React + Vite frontend with an Express + MongoDB (TypeScript) backend.

```
wash-me-ney-ney/
├── package.json            convenience scripts (install:all, dev:backend, ...)
├── frontend/               React + Vite app
│   ├── public/brand/       logo + BRAND-COLORS.md
│   └── src/
│       ├── pages/          Login, Dashboard, Orders, Customers, Services, Staff
│       ├── components/     Modal, OrderTable, UserMenu, Pagination, forms/ ...
│       ├── constants/      statuses, navigation, orderRules.js (copy of the backend rules)
│       ├── hooks/          useApi (load data), useDebounced
│       ├── services/       API client (sends the login cookie)
│       ├── styles/         main.css
│       ├── utils/          formatting helpers
│       ├── App.jsx         shows Login or the Workspace
│       └── Workspace.jsx   sidebar, top bar, pages, modals
└── backend/                Express + MongoDB API
    └── src/
        ├── config/         env parsing/validation, database connection
        ├── models/         Mongoose models (User, Session, Customer, Service, Order, Counter)
        ├── validators/     zod schemas for request params/query/bodies
        ├── middleware/     auth (login + roles), validate, security (helmet/CORS/rate limits), errors
        ├── controllers/    request handlers
        ├── routes/         URL routes (validation + controller wiring)
        ├── utils/          orderRules, orderCode, password hashing, shop date
        ├── scripts/        seed.ts sample data, createUser.ts
        ├── app.ts          Express app setup
        └── server.ts       entry point (DB connect + listen)
```

## Quick start

You need Node.js 20+ and a running MongoDB (local or Atlas).

```bash
npm run install:all
cp backend/.env.example backend/.env      # adjust MONGODB_URI / CORS_ORIGIN if needed
cp frontend/.env.example frontend/.env    # VITE_API_URL (default http://localhost:4000/api)
npm run seed             # sample data + dev logins from SEED_* in backend/.env
npm run dev:backend      # http://localhost:4000
npm run dev:frontend     # http://localhost:5173 (second terminal)
```

`npm run seed -- --reset` replaces customers, services and orders (logins are kept).

### Logins

- **Development:** `npm run seed` creates an owner and a staff login from the `SEED_*` values in `backend/.env`.
- **Real shop / production:** the seed refuses to run. Create the first owner once:
  ```bash
  npm run create-user -- --username ana --name "Ana Cruz" --role owner
  ```
  The password is asked for (typing is hidden). After that, the owner adds staff from the **Staff** page.
- There is no public sign-up. Forgotten passwords are reset by the owner on the Staff page.

### Upgrading an existing database (old statuses)

Order statuses Washing, Drying and Folding were merged into **In Progress**. On a database that has older orders, run once:

```bash
npm run migrate-statuses -- --dry-run   # shows how many orders would change
npm run migrate-statuses                # moves them to In Progress (safe to run again)
```

Each moved order gets a "Status update" line in its activity log. The API prints a warning at startup while any old statuses remain.

## Roles

| | Staff | Owner |
|---|---|---|
| Add / edit customers, create orders | ✓ | ✓ |
| Move orders forward, mark paid, cancel (refund or keep payment) | ✓ | ✓ |
| Move orders backwards, reopen completed/cancelled, mark paid orders unpaid | | ✓ |
| Add / change services and prices | | ✓ |
| Delete customers, services, unpaid orders | | ✓ |
| Manage staff accounts | | ✓ |

## Order rules

Rules live in `backend/src/utils/orderRules.ts` (enforced) and `frontend/src/constants/orderRules.js` (so the UI only offers valid choices). Keep the two in sync.

- New orders always start **Pending**. Payment can be Unpaid, or Paid if the customer pays upfront.
- Status moves forward: Pending → In Progress → Ready → Completed (plus Cancelled). Steps may be skipped, never reversed by staff.
- Upgrading a database from the old statuses (Washing / Drying / Folding)? Run `npm run migrate-statuses` once (see below).
- **Completed** requires **Paid**. Completed and Cancelled are final for staff; only the owner reopens.
- Cancelling a **paid** order needs a decision: **Refunded** (removed from the paid total) or keep **Paid**.
- Once an order is paid or closed, its customer, service and weight are locked.
- Every change is logged in the order's activity history (who, what, when).
- Order codes come from a counter, so a deleted order's code is never reused. Paid orders can't be deleted.
- Order dates use `APP_TIMEZONE` (default Asia/Manila), not the server's time zone.
- Each order keeps the price per kg it was created with, even if the service price changes later.

## API (all under `/api`; health check at `/health`)

Everything except `/auth/login` and `/auth/logout` needs a logged-in session cookie.

| Resource | Routes |
|---|---|
| auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/password` |
| customers | `GET/POST /customers`, `GET/PUT/DELETE /customers/:id` (list includes `orderCount`) |
| services | `GET/POST /services`, `GET/PUT/DELETE /services/:id` |
| orders | `GET /orders?page&limit&status&q&customerId&from&to` (paged), `GET /orders/stats`, `POST /orders`, `GET/PUT/DELETE /orders/:id` |
| users | `GET/POST /users`, `PUT /users/:id` (owner only) |

## Backend security & validation

- Logins: passwords hashed with scrypt; sessions are random tokens in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production); only a hash of the token is stored, and sessions expire after `SESSION_DAYS`.
- Logging out, turning an account off, or resetting a password ends the affected sessions on the server.
- Every `:id` must be a valid ObjectId; request params, queries and bodies are validated with zod. Unknown fields are rejected.
- `helmet` security headers, CORS restricted to `CORS_ORIGIN`, 10 KB body limit.
- Rate limiting: failed logins 10 / 15 min per IP; 600 requests and 200 changes / 15 min **per user** (so staff sharing one Wi-Fi don't share a limit). Set `TRUST_PROXY` when deployed behind a proxy.
- Mongoose `sanitizeFilter` against NoSQL operator injection; errors never leak internals.
- Environment variables are validated at startup.

## Limitations

No payment processing (payments are recorded, not collected). Customers and services are not paged.
