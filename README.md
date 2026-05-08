<div align="center">

# ⚡ FlowBridge

### API Integration & Workflow Automation Platform

**Connect anything. Automate everything.**

![FlowBridge Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20MongoDB-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

[Live Demo](#) • [Documentation](#) • [Report Bug](#)

</div>

---

## 📌 What is FlowBridge?

FlowBridge is a **white-label API Integration & Workflow Automation Platform** — similar to Zapier/Make.com but fully customizable for clients.

Build once → White label → Deploy for any client:
- Client A: `flows.clientA.com`
- Client B: `flows.clientB.com`

---

## 🎯 Use Cases

| Business | Automation |
|---|---|
| Ecommerce | Order → Sheet → PDF Invoice → Email + WhatsApp |
| Lead Gen | Form Submit → Sheet → Welcome Email → Slack |
| Finance | Payment webhook → DB → SMS + Receipt |
| Reporting | Daily 8PM → Read Sheet → Generate Report → Email |
| Inventory | Low stock webhook → WhatsApp + Email alert |

---

## ✨ Features

### Core
- ✅ Visual workflow builder
- ✅ Webhook trigger engine (receives from Shopify, Razorpay, etc.)
- ✅ Schedule/cron trigger (time-based automation)
- ✅ Manual trigger
- ✅ Variable system `{{customer_name}}`, `{{order_total}}`
- ✅ Filter/condition logic
- ✅ Delay action
- ✅ Retry failed actions (3 attempts: 1min, 5min, 15min)
- ✅ Real-time execution logs (step by step)
- ✅ Job queue — async execution (Bull + Redis)

### Integrations — Phase 1
| Service | Actions |
|---|---|
| 📧 Gmail | Send Email |
| 📊 Google Sheets | Append / Read / Update Row |
| 📱 Twilio | SMS + WhatsApp |
| 📄 PDF Generator | Invoice / Receipt / Report |
| 🌐 HTTP Request | Call any API |
| 💬 Slack | Send Message |
| 🗄️ MongoDB | Insert / Find / Update |
| 🔍 Filter | Condition check |
| ⏱️ Delay | Wait |

### Integrations — Phase 2
| Service | Type |
|---|---|
| 🛍️ Shopify | Webhook trigger |
| 💳 Razorpay | Payment webhook |
| 📦 Google Drive | Save files |
| 💡 Notion | Create pages |

### Security
- 🔐 JWT + Refresh tokens (15min + 7days)
- 🔑 AES-256 encrypted credentials
- 🛡️ bcrypt password hashing (rounds: 12)
- ⚡ Rate limiting (100 req/min)
- 🪖 Helmet.js security headers
- ✅ Joi validation on every route
- 🔏 Webhook signature verification

### White Label
- Custom company name + logo
- Custom primary color
- Custom domain
- All config-based — toggle per client

---

## 🏗️ Tech Stack

### Frontend
| Tech | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| Tailwind CSS v4 | Styling |
| Zustand | State management |
| TanStack Query | Data fetching + caching |
| React Hook Form + Zod | Forms + validation |
| React Router v6 | Routing |
| Recharts | Analytics charts |
| Lucide React | Icons |
| Axios | HTTP client |
| React Hot Toast | Notifications |

### Backend
| Tech | Purpose |
|---|---|
| Node.js + Express | API server |
| MongoDB Atlas | Database |
| Upstash Redis | Job queue + cache |
| Bull | Async job queue |
| JWT | Authentication |
| bcrypt | Password hashing |
| PDFKit | PDF generation |
| node-cron | Schedule triggers |
| Twilio SDK | SMS + WhatsApp |
| Google APIs | Gmail + Sheets OAuth |
| AES-256 | Credential encryption |

---

## 📁 Project Structure
flowbridge/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Redis, Email, Encryption, Google
│   │   ├── models/          # 10 Mongoose models
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # Express routes
│   │   ├── middleware/       # Auth, Rate limit, Validate
│   │   ├── engine/          # Workflow execution engine
│   │   │   ├── workflowEngine.js
│   │   │   ├── actionExecutor.js
│   │   │   ├── variableResolver.js
│   │   │   ├── conditionEvaluator.js
│   │   │   └── triggerHandler.js
│   │   ├── integrations/    # Gmail, Sheets, Twilio, etc.
│   │   ├── queue/           # Bull job queue + workers
│   │   └── services/        # Schedule, Notifications
│   ├── app.js
│   └── server.js
└── frontend/
├── src/
│   ├── pages/           # All app pages
│   ├── components/      # Reusable UI components
│   ├── services/        # API service layer
│   ├── store/           # Zustand state
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helpers
└── vite.config.js

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free)
- Upstash Redis account (free)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, REDIS_URL, JWT_SECRET
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
# Backend .env
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
JWT_SECRET=your_secret_32chars
REFRESH_TOKEN_SECRET=your_secret_32chars
ENCRYPTION_KEY=exactly_32_characters_here!
WEBHOOK_BASE_URL=https://your-backend.com

# Optional
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

---

## 📡 API Reference

### Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
GET  /api/auth/me

### Workflows
GET    /api/workflows
POST   /api/workflows
GET    /api/workflows/:id
PUT    /api/workflows/:id
DELETE /api/workflows/:id
PUT    /api/workflows/:id/activate
PUT    /api/workflows/:id/pause
POST   /api/workflows/:id/run
GET    /api/workflows/:id/logs
GET    /api/workflows/:id/stats

### Webhooks
POST /api/webhooks/receive/:webhookId

### Full API docs: [Postman Collection](#)

---

## 🔄 How It Works
External Service (Shopify/Razorpay)
↓
POST /api/webhooks/receive/:id
↓
200 OK immediately (non-blocking)
↓
Bull Job Queue (Redis)
↓
Worker picks up job
↓
Workflow Engine:

Load workflow + actions
Resolve variables {{customer_name}}
Execute actions in order:
→ Gmail: send email
→ Sheets: append row
→ Twilio: send WhatsApp
Log every step
Update stats


---

## 📊 Database Schema

| Collection | Purpose |
|---|---|
| Users | Auth + branding config |
| Workflows | Workflow definitions |
| Triggers | Webhook/Schedule/Form config |
| Actions | Action configs per workflow |
| Credentials | AES-256 encrypted API keys |
| ExecutionLogs | Run history |
| ExecutionSteps | Step-by-step logs |
| WorkflowTemplates | Pre-built templates |
| Integrations | Service catalog |
| Notifications | User notifications |

---

## 💼 White Label Delivery

This platform is designed for white-label delivery:

1. **Clone repo**
2. **Update `.env`:**
```env
   BRAND_NAME=ClientName
   BRAND_COLOR=#your_color
   BRAND_LOGO=https://client-logo.com/logo.png
```
3. **Deploy** on client's domain
4. **Done** — fully branded automation platform

---

## 👨‍💻 Author

**Kamal Lochan Sahu**
- GitHub: [@kamal-lochan-sahu](https://github.com/kamal-lochan-sahu)
- Portfolio: [Your Portfolio URL]

---

## 📄 License

MIT License — free to use for commercial projects.

---

<div align="center">
Built with ❤️ as a production-ready freelance portfolio project
</div>
