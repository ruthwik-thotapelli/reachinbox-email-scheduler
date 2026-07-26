<div align="center">
  <img src="https://raw.githubusercontent.com/ruthwik-thotapelli/reachinbox-email-scheduler/main/frontend/public/icons.svg" alt="Logo" width="80" height="80">
  <h1 align="center">ReachInbox – Full-Stack Email Job Scheduler</h1>
  
  <p align="center">
    A production-grade, highly concurrent email scheduling platform built for scale.
    <br />
    <a href="#features"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#demo">View Demo</a>
    ·
    <a href="#architecture">View Architecture</a>
    ·
    <a href="#getting-started">Getting Started</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

<hr />

## 📖 Table of Contents
<details>
  <summary>Click to expand</summary>
  
  1. [🎯 Problem Statement](#-problem-statement)
  2. [✨ Key Features & Constraints Met](#-key-features--constraints-met)
  3. [🏗 System Architecture](#-system-architecture)
  4. [💻 Tech Stack](#-tech-stack)
  5. [🚀 Getting Started](#-getting-started)
  6. [🧠 Design Decisions & Trade-offs](#-design-decisions--trade-offs)
  7. [🔗 API Endpoints](#-api-endpoints)
  8. [🎥 Video Demo](#-video-demo)
</details>

---

## 🎯 Problem Statement

At ReachInbox, reliable scheduling and sending of emails at scale is critical. This project is a slice of that core architecture. It provides a full-stack solution allowing users to authenticate, create email campaigns, upload large CSVs of leads, and reliably schedule them.

The system is designed to gracefully handle massive concurrency, strict rate limits, and server failures—all without relying on basic `cron` jobs.

---

## ✨ Key Features & Constraints Met

- **No Cron Jobs:** Scheduling is built purely on **BullMQ delayed jobs** running on Redis, ensuring distributed, lock-safe queue processing.
- **Restart Persistence & Idempotency:** If the Node.js server crashes or restarts, jobs remain safely in Redis. Future emails will trigger precisely on time. Previously processed emails are never duplicated.
- **Strict Rate Limiting:** Enforces max emails per hour per campaign. Implemented using atomic Redis counters (`INCR`). If a job hits the hourly cap, it dynamically calculates the delay until the next available hour window and safely reschedules itself.
- **Concurrency & Throttling:** BullMQ workers are configured to run concurrently. A staggered delay ensures minimum time between individual email dispatches to prevent SMTP bans.
- **Modern Dashboard:** Built with React, Vite, and Tailwind CSS. Features Google OAuth, CSV lead parsing, and real-time live tables.

---

## 🏗 System Architecture

```mermaid
graph TD
    Client[React Frontend] -->|Auth & Campaigns| API[Express API Server]
    Client -->|CSV Upload| API
    
    API <-->|Prisma ORM| DB[(PostgreSQL)]
    
    API -->|Job Data & Delay| Queue[BullMQ / Redis]
    
    Queue -->|Pops Jobs| Worker[Node.js Worker]
    
    Worker <-->|Check Rate Limits| Redis[(Redis Counters)]
    Worker <-->|Update Status| DB
    
    Worker -->|Nodemailer| SMTP[Ethereal SMTP]
    
    subgraph Infrastructure [Docker Environment]
        DB
        Queue
        Redis
    end
```

### Flow Breakdown:
1. **Creation:** User uploads a CSV. The API parses leads, creates a `Campaign` in PostgreSQL, and generates individual `EmailJob` records.
2. **Scheduling:** The API computes strict millisecond delays for each email to guarantee staggering, then pushes them to BullMQ.
3. **Execution:** The isolated worker process pulls jobs as they mature.
4. **Validation:** The worker runs an atomic Redis `INCR` to check the hourly limit. If exceeded, it reschedules the job. Otherwise, it sends via Ethereal SMTP and marks the DB record as `SENT`.

---

## 💻 Tech Stack

### **Frontend**
- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** (for aesthetic, ReachInbox-style glassmorphism UI)
- **Lucide React** (Iconography)
- **PapaParse** (Client-side CSV parsing)

### **Backend**
- **Node.js + Express.js**
- **TypeScript**
- **BullMQ + ioredis** (Message Queue)
- **Prisma** (Next-generation ORM)
- **Nodemailer** (Ethereal SMTP Integration)

### **Infrastructure**
- **PostgreSQL 15**
- **Redis 7**
- **Docker & Docker Compose**

---

## 🚀 Getting Started

Follow these steps to run the complete environment locally.

### 1. Prerequisites
- Docker & Docker Compose installed
- Node.js (v18+)

### 2. Start the Infrastructure (Database & Redis)
```bash
docker-compose up -d
```
*This starts PostgreSQL on port 5432 and Redis on port 6379.*

### 3. Setup the Backend
Navigate to the backend directory, install dependencies, and run database migrations.
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

Create a `.env` file inside the `backend` folder:
```env
DATABASE_URL="postgresql://reachinbox:password123@localhost:5432/reachinbox"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=3000

# Generate these at ethereal.email
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-ethereal-username"
SMTP_PASS="your-ethereal-password"
```

Start the backend server and worker:
```bash
npm run dev
```

### 4. Setup the Frontend
In a new terminal, start the Vite development server.
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧠 Design Decisions & Trade-offs

| Decision | Rationale |
| :--- | :--- |
| **BullMQ over Node-Cron** | `node-cron` is in-memory and volatile. BullMQ operates on Redis, making it distributed, crash-resistant, and inherently scalable across multiple Node instances. |
| **Redis `INCR` for Rate Limiting** | Counting jobs in PostgreSQL is too slow and susceptible to race conditions. Using a Redis atomic `INCR` with a 2-hour TTL ensures lighting-fast, race-condition-free hourly limit checks. |
| **Staggered Delays vs. Worker Pausing** | Instead of pausing the entire worker to enforce the "minimum delay between emails", delays are calculated mathematically *before* pushing to the queue. This allows workers to remain highly concurrent for other campaigns. |
| **Prisma ORM** | Picked over raw SQL/TypeORM for its unmatched TypeScript type-safety and rapid schema modeling. |

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/campaigns` | Accepts Campaign details and an array of emails. Schedules jobs. |
| `GET` | `/api/campaigns/scheduled` | Retrieves all pending/delayed emails sorted by time. |
| `GET` | `/api/campaigns/sent` | Retrieves all successfully processed or failed emails. |

---

## 🎥 Video Demo
*(Assignment constraint: Include a max 5-minute Loom video demonstrating the frontend, Postman API, scheduling, rate limiting, and a server restart scenario).*

[🔗 **Click here to watch the Loom Demo**](YOUR_LOOM_LINK_HERE)

---

<p align="center">
  Built with ❤️ for the ReachInbox SDE Assignment.
</p>
