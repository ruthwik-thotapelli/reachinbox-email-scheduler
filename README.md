# ReachInbox – Full-Stack Email Job Scheduler

Production-grade full-stack email scheduling platform built with React, TypeScript, Node.js, Express, BullMQ, Redis, and PostgreSQL. Supports Google OAuth, CSV lead uploads, delayed email scheduling, concurrency, rate limiting, idempotent processing, and restart-safe background jobs using Ethereal SMTP.

## Tech Stack
*   **Frontend**: React + TypeScript + Tailwind CSS (Vite)
*   **Backend**: Node.js + Express + TypeScript
*   **Queue**: BullMQ + Redis
*   **Database**: PostgreSQL
*   **SMTP**: Ethereal Email
*   **Auth**: Google OAuth (mocked in UI for now)
*   **Infrastructure**: Docker (Redis & Postgres)

## Features
- **Frontend**: Aesthetic Dashboard matching modern UI trends. Upload CSVs for lead generation, schedule campaigns with start delays, view Scheduled vs Sent emails.
- **Backend Scheduler**: Persistent queue using BullMQ. If the server restarts, future emails are still sent at the right time without duplication.
- **Concurrency**: BullMQ workers set up with concurrency limits.
- **Rate Limiting**: Custom Redis-backed counters to enforce max emails per hour per campaign. If exceeded, jobs are seamlessly re-scheduled to the next hour block.

## How to Run

### 1. Start Infrastructure (Docker)
```bash
docker-compose up -d
```
This starts PostgreSQL (port 5432) and Redis (port 6379).

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```
Create a `.env` in the root:
```
DATABASE_URL="postgresql://reachinbox:password123@localhost:5432/reachinbox"
REDIS_HOST="localhost"
REDIS_PORT=6379
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your-ethereal-user"
SMTP_PASS="your-ethereal-password"
PORT=3000
```
Run the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.
