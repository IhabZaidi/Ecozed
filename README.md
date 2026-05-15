# 🌿 Ecozed — Open-Source E-Commerce Management Platform

**Ecozed** is a free, open-source, multi-store e-commerce management system designed to help Algerian and Arab dropshippers, small businesses, and e-commerce entrepreneurs manage their entire operation from a single dashboard.

Track orders across multiple stores, manage inventory, handle shipping with **Ecotrack** integration, calculate staff salaries, print shipping labels and bordereaux, sync delivery tracking, and much more — **all for free, forever**.

> 📱 **Mobile app (Flutter) — Coming Soon**

---

## ✨ Why Ecozed?

| Feature | Benefit |
|---------|---------|
| 🆓 **100% Free & Open Source** | No subscriptions, no hidden fees. MIT licensed. |
| 🏪 **Multi-Store Support** | Manage all your stores from one dashboard |
| 📦 **Ecotrack Shipping Integration** | Send orders, print labels, sync tracking automatically |
| 👥 **Staff Management** | Track performance, calculate salaries & bonuses |
| 📊 **Real-Time Dashboard** | See sales, profits, and order stats at a glance |
| 🌐 **Arabic & English UI** | Full bilingual support (RTL ready) |
| 🔌 **WooCommerce Integration** | Auto-import orders from WooCommerce stores |
| 📄 **PDF Labels & Bordereaux** | Generate shipping documents with one click |

---

## 📺 Video Tutorials

Follow along with the complete video playlist covering every feature:

[![Ecozed YouTube Playlist](https://img.shields.io/badge/YouTube-Playlist-red)](https://www.youtube.com/playlist?list=PL-ZVUkT94N4bFoD5hOSHhmSoBoM9ZDuiQ)

[**Watch the Full Playlist →**](https://www.youtube.com/playlist?list=PL-ZVUkT94N4bFoD5hOSHhmSoBoM9ZDuiQ)

---

## 📞 Contact & Suggestions

Have an idea or feature request? I'd love to hear from you!

**WhatsApp:** [+213 796 33 25 34](https://wa.me/213796332534)

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Database** | PostgreSQL ([Neon DB](https://neon.tech/) recommended) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Auth** | JWT (bcrypt + jsonwebtoken) |
| **Validation** | [Zod](https://zod.dev/) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **PDF** | [pdf-lib](https://pdf-lib.org/) |
| **Container** | Docker (optional) |

---

## 📋 Implemented Features

| Module | Features |
|--------|----------|
| **Dashboard** | Real-time stats, sales analytics, order overview, multi-store performance |
| **Orders** | Create/edit/delete, status tracking, bulk operations, filters, search |
| **Products** | CRUD, weight/cost/profit tracking, quantity-based offers, bulk update/delete |
| **Stores** | Multi-store management, per-store products and orders |
| **Users (Staff)** | Role-based access (Admin/Worker), permissions system, store assignment |
| **Salary** | Base salary, confirmation bonus, upsell bonus, payout history, performance tracking |
| **Shipping (Ecotrack)** | Send orders, validate/dispatch, print labels, bordereaux PDF, sync tracking, stop desk support |
| **Integrations** | WooCommerce auto-import, webhook endpoints, API key management |
| **Settings** | Shipping providers, shipping cost per wilaya, data backup/restore, stop desk commune sync |
| **Localization** | Full Arabic and English UI, RTL support |

---

## 🚀 Deployment Options

### Option 1: 100% Free — Deploy on Vercel (Recommended)

[Vercel](https://vercel.com/) offers a generous free tier perfect for this project.

### Option 2: Your Own Server (with Docker)

Use the included `Dockerfile` for a containerized deployment on any VPS or dedicated server.

### Option 3: Google Cloud Run

Deploy as a serverless container on Google Cloud Run for auto-scaling and pay-per-use pricing.

---

## ⚡ Quick Start Guide

### Step 1: Create a Database

Create a free PostgreSQL database on **[Neon DB](https://neon.tech/)** (their free tier is excellent):

1. Sign up at [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy your connection string (looks like `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname`)

### Step 2: Fork the Repository

Fork this repo on GitHub to your account.

### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub
2. Click **Add New → Project**
3. Select your forked repository
4. In **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon DB connection string |
| `JWT_SECRET` | Any secure random string (e.g. generated via `openssl rand -base64 32`) |
| `NODE_ENV` | `production` |

5. Click **Deploy**

### Step 4: First Login

Once deployed, navigate to your Vercel URL. Register an admin account and start managing your business!

---

### Docker Deployment (Alternative)

```bash
docker build -t ecozed .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-neon-connection-string" \
  -e JWT_SECRET="your-secret-key" \
  -e NODE_ENV="production" \
  ecozed
```

### Google Cloud Run (Alternative)

```bash
# Build and push to Google Container Registry
docker build -t gcr.io/your-project/ecozed .
docker push gcr.io/your-project/ecozed

# Deploy to Cloud Run
gcloud run deploy ecozed \
  --image gcr.io/your-project/ecozed \
  --set-env-vars "DATABASE_URL=...,JWT_SECRET=...,NODE_ENV=production" \
  --platform managed
```

---

## 🗺️ Roadmap

- [x] Multi-store management
- [x] Order CRUD & status tracking
- [x] Product management with offers
- [x] Staff management with permissions
- [x] Salary & bonus calculations
- [x] Ecotrack shipping integration (send, validate, labels, tracking sync)
- [x] WooCommerce integration
- [x] Bilingual UI (Arabic / English)
- [x] Data backup & restore
- [ ] **📱 Mobile App (Flutter)** — Coming Soon
- [ ] Shopify integration
- [ ] Advanced analytics & reports
- [ ] Automated import from Facebook/Instagram shops
- [ ] Telegram notifications
- [ ] API tokens for third-party integrations
- [ ] Dark mode

---

## 🔗 Links

| Resource | Link |
|----------|------|
| 📺 YouTube Playlist | [Watch Now](https://www.youtube.com/playlist?list=PL-ZVUkT94N4bFoD5hOSHhmSoBoM9ZDuiQ) |
| 💾 Neon DB (Database) | [https://neon.tech/](https://neon.tech/) |
| 🚀 Vercel (Hosting) | [https://vercel.com/](https://vercel.com/) |
| 💬 WhatsApp Support | [+213 796 33 25 34](https://wa.me/213796332534) |
| 🐙 GitHub | [Fork this project](https://github.com/) |

---

## 📄 License

This project is **open source** and will remain **free forever**. MIT License.

---

<p align="center">Made with ❤️ for the Algerian and Arab e-commerce community</p>
