# internship-tracker-backend

The backend for the COMP208 internship tracker group project

## 🟩 Backend (NestJS + Prisma)

Responsible for:

- Authentication (JWT verification)
- Password hashing (bcrypt)
- Authorization (user ownership checks)
- Application lifecycle logic
- Analytics aggregation queries
- Emitting WebSocket events
- Input validation

This is your system brain.

---

## 🟨 Database (Supabase PostgreSQL)

Responsible for:

- Persistent storage
- Relational integrity
- Index performance
- Query execution

It does not:

- Know about JWT
- Emit events
- Perform business logic

---

## Core Stack

| Frontend | Backend | Infrastructure |
| --- | --- | --- |
| React (Vite) | NestJS | Docker (development only) |
| TypeScript | Prisma ORM | Vercel (frontend) |
| React Query | PostgreSQL (Supabase) | Render (backend) |
| Axios | JWT (simple access token) | Supabase (database) |
|  | bcrypt |  |

---

## 🟩 Backend

| NestJS | Modular backend framework (application core) |
| --- | --- |
| Exposes REST endpoints | Implements business logic |
| Handles authentication | Validates requests |
| Structures code into modules |  |

This is your system brain.

| Prisma ORM | Database abstraction and type-safe query layer |
| --- | --- |
| Translates TypeScript queries → SQL | Enforces schema consistency |
| Prevents raw SQL errors | Generates typed database client |

Important:
Prisma = bridge between NestJS and PostgreSQL.

| PostgreSQL (Supabase) | Persistent relational data store |
| --- | --- |
| Stores users | Stores applications |
| Stores status history | Executes SQL queries |

Supabase:

| Managed hosting | Backups | Monitoring |
| --- | --- | --- |

| JWT (Access Token Only) | Stateless authentication mechanism |
| --- | --- |
| Encodes user identity | Sent in Authorization header |
| Verified on every request | No server-side sessions required |

Keeps backend stateless.

| bcrypt | Password hashing algorithm |
| --- | --- |
| Hashes user passwords before storage | Protects against plaintext leaks |
| Slow hashing to prevent brute force |  |

Security best practice.

---

## 🟪 Infrastructure

| Docker (Development Only) | Local environment standardisation |
| --- | --- |
| Ensures consistent Node version | Avoids “works on my machine” issues |
| Containerises backend for local testing |  |

Not used in production.

| Render (Backend Hosting) | Node.js server hosting |
| --- | --- |
| Runs NestJS server | Handles HTTPS |
| Manages environment variables | Keeps API publicly accessible |

| Supabase (Database Hosting) | Managed PostgreSQL provider |
| --- | --- |
| Cloud database hosting | Backups |
| Admin UI | Secure connection endpoint |