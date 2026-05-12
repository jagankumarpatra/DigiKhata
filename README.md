<div align="center">

# 💰 DigiKhata

### Open-source MSME Merchant Ledger API with AI-Powered Payment Reminders

**India has 60M+ MSMEs still managing their books on paper.**
DigiKhata is a production-grade backend that digitises their ledger, automates payment reminders, and generates PDF account statements — built on the same patterns powering apps like Khatabook.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Design Decisions](#-design-decisions)

</div>

---

## ✨ Features

- 🔐 **Phone OTP Auth** — JWT-based authentication with Redis-backed OTP (5-min TTL, auto-expires)
- 📒 **Merchant Ledger** — credit/debit transactions with **atomic balance updates** via MongoDB multi-document transactions
- 🔁 **Idempotent Transactions** — safe to retry on network failure; duplicate requests return the same result, no double-charge ever
- 🤖 **AI-Drafted Reminders** — Claude API generates personalised Hinglish payment nudges per customer; sent via WhatsApp/SMS through Twilio
- ⚡ **Async Job Queue** — BullMQ + Redis keeps the API response under 50ms; Twilio calls happen in background with 3× exponential-backoff retry
- 📄 **PDF Statements** — on-demand account statements built in-memory with PDFKit and streamed directly to client
- 📊 **Ledger Summary** — aggregated receivables, payables, net balance, and top-5 debtors via MongoDB aggregation pipeline
- 🛡️ **Production-ready** — Zod validation, Helmet security headers, CORS, rate limiting (100 req/min), structured logging

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 18+ | LTS, native async, fast I/O |
| Language | TypeScript (strict) | Type safety catches bugs at compile time |
| Framework | Express.js | Minimal, battle-tested, middleware ecosystem |
| Database | MongoDB + Mongoose | Flexible schema, multi-document transactions for atomic balance |
| Cache / Queue | Redis + BullMQ | OTP TTL, job persistence, retry logic |
| Auth | JWT + Phone OTP | Stateless auth; OTP is standard for Indian MSME apps |
| AI | Anthropic Claude API | Personalised Hinglish reminder drafts |
| Notifications | Twilio WhatsApp/SMS | Highest open rate for Indian merchants |
| PDF | PDFKit | Zero-dependency, streams directly — no temp files |
| Validation | Zod | Schema-first validation with TypeScript inference |
| Security | Helmet + CORS + rate-limit | OWASP baseline |
| Testing | Jest + Supertest | Unit + integration tests |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Merchant App / Client                   │
│                    (Mobile / Web / Postman)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + Bearer JWT
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Express API                           │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  Routes  │→ │ Controllers │→ │      Services         │   │
│  └──────────┘  └─────────────┘  └──────────────────────┘   │
│                                                              │
│  Middleware: Helmet · CORS · Rate-limit · JWT · Zod Validate │
└──────┬────────────────────────┬────────────────────────────┘
       │                        │
       ▼                        ▼
┌─────────────┐        ┌────────────────┐
│   MongoDB   │        │     Redis      │
│             │        │                │
│ • Merchant  │        │ • OTP store    │
│ • Customer  │        │   (5-min TTL)  │
│ • Transaction│       │ • BullMQ jobs  │
│ • Reminder  │        └───────┬────────┘
└─────────────┘                │
                               ▼
                    ┌─────────────────────┐
                    │   BullMQ Worker     │
                    │  (background async) │
                    └────────┬────────────┘
                             │
               ┌─────────────┴──────────────┐
               ▼                            ▼
    ┌──────────────────┐         ┌──────────────────┐
    │   Claude API     │         │     Twilio       │
    │ Draft Hinglish   │         │  WhatsApp / SMS  │
    │ reminder message │         │  (3× retry on    │
    │                  │         │   failure)       │
    └──────────────────┘         └──────────────────┘
```

---

## 🔄 Request Flows

### 1. Auth — Phone OTP → JWT

```
Client                    API                    Redis
  │                        │                       │
  │── POST /send-otp ──→   │                       │
  │   { phone }            │── generateOtp() ──→   │
  │                        │── SET otp:phone ──→   │ TTL: 5 min
  │                        │   (logs OTP in dev)   │
  │←── { success: true } ──│                       │
  │                        │                       │
  │── POST /verify-otp ──→ │                       │
  │   { phone, otp }       │── GET otp:phone ──→   │
  │                        │←── stored OTP ────────│
  │                        │── DEL otp:phone ──→   │ prevent replay
  │                        │── upsert Merchant     │
  │←── { token: JWT } ─────│                       │
```

### 2. Add Transaction — Atomic + Idempotent

```
Client                    API                   MongoDB
  │                        │                       │
  │── POST /transactions ─→│                       │
  │   { customerId,        │── findOne({           │
  │     type: CREDIT,      │     idempotencyKey }) →│
  │     amount: 500,       │                       │
  │     idempotencyKey }   │   if exists: return   │ ← idempotent
  │                        │                       │
  │                        │── session.withTransaction() ──→│
  │                        │     INSERT transaction doc     │
  │                        │     UPDATE customer.balance    │ ← atomic
  │                        │     (both or neither)          │
  │←── { 201, txn data } ──│                       │
```

### 3. AI Reminder — Async Queue

```
Client         API           Claude API     Redis/BullMQ    Twilio
  │             │                │               │              │
  │─POST /reminders→             │               │              │
  │  { customerId }              │               │              │
  │             │──draftMessage()────────→       │              │
  │             │←─Hinglish msg──────────        │              │
  │             │──save Reminder──→ MongoDB      │              │
  │             │──queue job────────────────────→│              │
  │←200 OK ─────│  (instant response)            │              │
  │             │                    (background)│              │
  │             │                    worker picks│──send msg──→ │
  │             │                    on fail: retry 3×          │
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7+ running locally
- Redis 7+ running locally

```bash
# Quickest way — Docker
docker run -d -p 27017:27017 --name mongo mongo:7
docker run -d -p 6379:6379  --name redis redis:7
```

### Installation

```bash
git clone https://github.com/jagankumarpatra/DigiKhata.git
cd DigiKhata
npm install
cp .env.example .env
```

### Environment Setup

Edit `.env` — only 2 fields are required to get started:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/digikhata
JWT_SECRET=any-random-string-minimum-32-characters-long

# Optional — AI reminders (fallback to template if not set)
ANTHROPIC_API_KEY=your_key_from_console.anthropic.com

# Optional — WhatsApp/SMS (logs to console if not set)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Run

```bash
npm run dev
```

Expected output:
```
[INFO] ✅ MongoDB connected
[INFO] ✅ Redis connected
[INFO] ✅ Reminder worker started
[INFO] 🚀 DigiKhata running on http://localhost:4000
```

Test it:
```bash
curl http://localhost:4000/health
# { "status": "ok", "service": "digikhata" }
```

---

## 📡 API Reference

Base URL: `http://localhost:4000/api/v1`

All protected routes require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/send-otp` | `{ phone }` | Send OTP to merchant phone |
| `POST` | `/auth/verify-otp` | `{ phone, otp, name?, businessName? }` | Verify OTP → returns JWT |

### Customers 🔒

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/customers` | `{ name, phone }` | Add a customer |
| `GET` | `/customers` | — | List customers (paginated) |
| `GET` | `/customers/:id` | — | Get single customer + balance |
| `PATCH` | `/customers/:id` | `{ name?, phone? }` | Update customer |
| `DELETE` | `/customers/:id` | — | Delete customer |

### Transactions 🔒

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/transactions` | `{ customerId, type, amount, idempotencyKey, note? }` | Add credit/debit (atomic + idempotent) |
| `GET` | `/transactions/summary` | — | Receivables, payables, top debtors |
| `GET` | `/transactions/:customerId` | — | Customer ledger (paginated) |
| `GET` | `/transactions/:customerId/statement` | — | Download PDF statement |

### Reminders 🔒

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/reminders` | `{ customerId }` | Queue AI-drafted WhatsApp reminder |

---

## 🧪 Testing with Postman

A complete Postman collection with 19 requests, pre-request scripts, and test assertions is included.

**Import:** `Postman → Import → DigiKhata_Postman_Collection.json`

The collection auto-saves variables between requests:
- After `verify-otp` → saves `{{token}}` automatically
- After `create customer` → saves `{{customerId}}` automatically
- Each transaction → auto-generates a unique `idempotencyKey`

**Recommended test sequence:**

```
Health Check → Send OTP → Verify OTP (paste OTP from terminal)
→ Create Customer → Add CREDIT (₹500) → Add DEBIT (₹200)
→ Idempotency Test (run twice — same response) → Ledger Summary
→ Download PDF → Queue AI Reminder → Run Error Cases
```

---

## 🧠 Design Decisions

### Why MongoDB transactions for balance updates?
If the server crashes between inserting the transaction document and updating the customer balance, a standard write leaves the database in an inconsistent state — money recorded but balance unchanged. MongoDB multi-document transactions ensure both writes succeed or both roll back. No phantom money, ever.

### Why idempotency keys?
Mobile networks in India are unreliable. A merchant taps "Add ₹500" and the request times out — did it go through? Without idempotency, retrying creates a duplicate entry. With a client-generated UUID per transaction, the server safely returns the existing result on retry. Zero double-charges.

### Why BullMQ instead of calling Twilio directly in the request?
Twilio's API takes 200-800ms. Blocking the API thread on a third-party call means every reminder request is slow and a Twilio outage blocks your own API. BullMQ offloads the send to a background worker — the API responds in <50ms, and if Twilio fails, BullMQ retries 3× with exponential backoff automatically.

### Why Redis for OTP storage?
Redis TTL auto-expires OTPs in 5 minutes with zero application code. MongoDB would need a cron job or TTL index. Redis is also in-memory, so OTP lookup is O(1) with sub-millisecond latency.

### Why PDFKit in-memory instead of saving to disk?
Saving files to disk requires cleanup jobs, storage management, and doesn't scale horizontally. PDFKit builds the PDF as a Buffer in memory and streams it directly in the HTTP response — stateless, fast, and zero disk I/O.

---

## 📂 Project Structure

```
src/
├── config/
│   ├── env.ts              # Zod-validated environment variables
│   ├── db.ts               # MongoDB connection with reconnect handling
│   └── redis.ts            # Redis client (shared by BullMQ + OTP)
├── models/
│   ├── merchant.model.ts
│   ├── customer.model.ts   # balance, totalCredit, totalDebit fields
│   ├── transaction.model.ts # idempotencyKey unique index
│   └── reminder.model.ts   # PENDING → SENT/FAILED status
├── controllers/            # Request parsing + response shaping
├── services/               # Business logic (no Express types here)
│   ├── auth.service.ts
│   ├── customer.service.ts
│   ├── transaction.service.ts  # Atomic session.withTransaction()
│   ├── reminder.service.ts     # Claude API integration
│   └── pdf.service.ts          # PDFKit statement builder
├── routes/                 # Express routers
├── middleware/
│   ├── auth.ts             # JWT verification → req.merchantId
│   ├── error.ts            # AppError class + global error handler
│   └── validate.ts         # Zod schema middleware factory
├── jobs/
│   ├── reminder.queue.ts   # BullMQ Queue definition
│   └── reminder.worker.ts  # Worker — calls Twilio, updates status
├── utils/
│   ├── logger.ts           # Structured console logger with timestamps
│   ├── jwt.ts              # signToken / verifyToken helpers
│   └── otp.ts              # generateOtp / saveOtp / verifyOtp (Redis)
└── types/
    └── index.ts            # AuthRequest, TransactionType, shared types
```

---

## 🗺 Roadmap

- [x] Phone OTP auth + JWT
- [x] Customer CRUD with balance tracking
- [x] Atomic transactions with idempotency
- [x] AI-drafted payment reminders (Claude API)
- [x] Async BullMQ worker + Twilio WhatsApp
- [x] PDF account statement generation
- [x] Ledger summary + top debtor aggregation
- [ ] Docker Compose setup
- [ ] GitHub Actions CI pipeline
- [ ] Swagger / OpenAPI docs
- [ ] Multi-business support per merchant
- [ ] Webhook for payment confirmation
- [ ] Analytics dashboard (Next.js)

---

## 👨‍💻 Author

**Jagan Kumar Patra** — Backend Engineer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github)](https://github.com/jagankumarpatra)

---

<div align="center">
Built to solve a real problem — 60M Indian merchants still use paper ledgers.<br/>
If you're hiring backend engineers, <a href="https://www.linkedin.com/in/">let's talk</a>.
</div>
