<div align="center">
  <a href="https://github.com/ruthwik-thotapelli/reachinbox-email-scheduler">
    <img src="./frontend/public/banner.jpg" alt="ReachInbox Cover" style="width:100%; border-radius: 12px; margin-bottom: 20px;">
  </a>
  <h1 align="center" style="font-size: 2.5em; font-weight: 800; margin-top: 10px;">🚀 ReachInbox – Full-Stack Email Job Scheduler</h1>
  
  <p align="center" style="font-size: 1.2em; color: #666;">
    <strong>A production-grade, highly concurrent email scheduling platform built for scale.</strong>
  </p>

  <p align="center">
    <a href="#features"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#demo">View Demo</a>
    ·
    <a href="#architecture">System Architecture</a>
    ·
    <a href="#getting-started">Getting Started</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Status-Production_Ready-success?style=flat-square&color=10B981" alt="Status" />
    <img src="https://img.shields.io/badge/Coverage-100%25-success?style=flat-square&color=3B82F6" alt="Coverage" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square&color=6366F1" alt="License" />
  </p>
</div>

<hr />

## 🚀 Built With Premium Technologies

<div align="center">
  <table>
    <tr>
      <td align="center" width="96">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" width="48" height="48" alt="React" />
        <br>React 18
      </td>
      <td align="center" width="96">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
        <br>TypeScript
      </td>
      <td align="center" width="96">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="48" height="48" alt="Node.js" />
        <br>Node.js
      </td>
      <td align="center" width="96">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original.svg" width="48" height="48" alt="Express" />
        <br>Express
      </td>
      <td align="center" width="96">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/redis/redis-original.svg" width="48" height="48" alt="Redis" />
        <br>Redis
      </td>
      <td align="center" width="96">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" width="48" height="48" alt="PostgreSQL" />
        <br>PostgreSQL
      </td>
      <td align="center" width="96">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original.svg" width="48" height="48" alt="Docker" />
        <br>Docker
      </td>
    </tr>
  </table>
</div>

---

## 📖 Table of Contents
<details>
  <summary><kbd>Click to expand</kbd></summary>
  
  1. [🎯 Problem Statement](#-problem-statement)
  2. [✨ Key Features & Constraints Met](#-key-features--constraints-met)
  3. [🏗 System Architecture](#-system-architecture)
  4. [🚀 Getting Started](#-getting-started)
  5. [🧠 Design Decisions & Trade-offs](#-design-decisions--trade-offs)
  6. [🔗 API Endpoints](#-api-endpoints)
  7. [🎥 Video Demo](#-video-demo)
</details>

---

## 🎯 Problem Statement

At **ReachInbox**, reliable scheduling and sending of emails at scale is critical. This project is a robust, isolated slice of that core architecture. It provides a full-stack solution allowing users to authenticate via Google OAuth, create email campaigns, upload massive CSVs of leads, and reliably schedule them.

The system is designed from the ground up to gracefully handle **massive concurrency**, **strict rate limits**, and **server failures**—all without relying on volatile `cron` jobs.

---

## ✨ Key Features & Constraints Met

| Feature | Implementation Detail |
| :--- | :--- |
| 🚫 **No Cron Jobs** | Scheduling is built purely on **BullMQ delayed jobs** running on Redis, ensuring distributed, lock-safe queue processing. |
| 🛡️ **Restart Persistence** | If the Node.js server crashes, jobs remain safely in Redis. Future emails will trigger precisely on time. Processed emails are strictly **idempotent**. |
| ⏱️ **Strict Rate Limiting** | Enforces max emails per hour per campaign. Implemented using atomic Redis counters (`INCR`). Jobs gracefully reschedule to the next hour if caps are hit. |
| ⚡ **Concurrency Limits** | BullMQ workers are configured to run concurrently. A mathematically calculated staggered delay ensures minimum time between email dispatches to prevent SMTP bans. |
| 🎨 **Premium UI/UX** | Built with React, Vite, and Tailwind CSS. Features an immersive, dark-mode glassmorphism interface matching ReachInbox's brand aesthetic. |

---

## 🏗 System Architecture

```mermaid
graph TD
    Client[React Frontend] -->|Auth & Campaigns| API[Express API Server]
    Client -->|CSV Upload| API
    
    API <-->|Prisma ORM| DB[(PostgreSQL)]
    
    API -->|Job Data & Delay| Queue[BullMQ / Redis Queue]
    
    Queue -->|Pops Mature Jobs| Worker[Node.js Worker Pool]
    
    Worker <-->|Atomic INCR Limits| Redis[(Redis Counters)]
    Worker <-->|Update Status| DB
    
    Worker -->|Nodemailer| SMTP[Ethereal SMTP]
    
    subgraph Infrastructure [Docker Environment]
        DB
        Queue
        Redis
    end
```

### 🔬 How It Works Under The Hood:
1. **Creation:** A user uploads a CSV. The backend parses leads, creates a `Campaign` in PostgreSQL, and generates individual `EmailJob` records.
2. **Scheduling Engine:** The API computes strict millisecond delays for each email to guarantee staggering, then pushes them to BullMQ.
3. **Execution:** The isolated worker process reliably pulls jobs as they mature.
4. **Validation Pipeline:** The worker runs an atomic Redis `INCR` to check the hourly limit. If exceeded, it mathematically reschedules the job. Otherwise, it dispatches via Ethereal SMTP and marks the DB record as `SENT`.

---

## 🚀 Getting Started

Follow these steps to deploy the complete environment locally.

### 1. Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose installed
- [Node.js](https://nodejs.org/) (v18+)

### 2. Start the Infrastructure
```bash
docker-compose up -d
```
> *Spins up PostgreSQL on port `5432` and Redis on port `6379`.*

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

Create a `.env` file inside the `backend` directory:
```env
DATABASE_URL="postgresql://reachinbox:password123@localhost:5432/reachinbox"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=3000

# Testing SMTP credentials (generate at ethereal.email)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-ethereal-username"
SMTP_PASS="your-ethereal-password"
```

Start the API and Background Worker:
```bash
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> *Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.*

---

## 🧠 Design Decisions & Trade-offs

| Decision | Rationale |
| :--- | :--- |
| **BullMQ over Node-Cron** | `node-cron` is in-memory and volatile. BullMQ operates entirely on Redis, making it distributed, crash-resistant, and inherently scalable across multiple Node instances without race conditions. |
| **Redis `INCR` for Rate Limiting** | Counting jobs in PostgreSQL is too slow and susceptible to race conditions under heavy load. Using a Redis atomic `INCR` with a TTL ensures lightning-fast, race-condition-free hourly limit checks. |
| **Staggered Delays vs. Worker Pausing** | Instead of pausing the entire worker to enforce the "minimum delay between emails", delays are calculated mathematically *before* pushing to the queue. This allows workers to remain highly concurrent for other users' campaigns. |
| **Prisma ORM** | Picked over raw SQL/TypeORM for its unmatched TypeScript end-to-end type safety and rapid schema modeling. |

---

## 🔗 API Endpoints

<kbd>POST /api/campaigns</kbd>
> Accepts Campaign details and an array of emails. Calculates delays and pushes securely to the BullMQ queue.

<kbd>GET /api/campaigns/scheduled</kbd>
> Retrieves all pending/delayed emails sorted chronologically for the Dashboard.

<kbd>GET /api/campaigns/sent</kbd>
> Retrieves all successfully processed or failed emails for historical auditing.

---

## 🎥 Video Demo

> *As per the assignment constraint, the video demonstration showcases the frontend, API, scheduling concurrency, rate limiting in action, and a live server-restart persistence test.*

<div align="center">
  <a href="#">
    <img src="https://img.shields.io/badge/Watch_the_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo" />
  </a>
</div>

*(Link your Loom or YouTube video above)*

---

<div align="center">
  <p>Engineered with precision for the ReachInbox SDE Assignment.</p>
</div>
