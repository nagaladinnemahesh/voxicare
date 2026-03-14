# Voxicare 🏥

A full-stack **Voice AI Healthcare Appointment Booking Platform** where patients can book, cancel, and reschedule doctor appointments using their **voice** — powered by AI.

> "Just speak to book" — Voxicare uses voice recognition, AI reasoning, and text-to-speech to make healthcare appointment booking as easy as a conversation.

---

## ✨ Features

### Patient

- 🎤 **Voice booking** — speak naturally to book appointments
- 💬 **Text chat** — type to interact with Voxia AI assistant
- 📅 **Appointment management** — view, cancel, reschedule
- 🔐 **JWT authentication** — secure login/register

### Doctor

- 📋 **Dashboard** — view all patient appointments
- ✅ **Appointment actions** — confirm, complete, cancel
- 🗓️ **Availability management** — set working days and hours
- 🏖️ **Leave management** — mark leave days

### Admin

- 📊 **Platform stats** — patients, doctors, appointments
- ✅ **Doctor approval** — approve, reject, suspend doctors
- 👥 **User management** — view all patients and appointments

---

## 🧠 How Voxia Works

```
User speaks → Deepgram STT → Text
Text → Gemini AI Agent → Tool calls (find doctor, check availability, book)
Agent response → ElevenLabs TTS → Audio played back to user
```

Voxia is an **agentic AI** — it autonomously:

1. Finds doctors by specialization and city
2. Checks availability across dates
3. Books appointments with conflict detection
4. Lists, cancels and reschedules appointments

---

## 🛠️ Tech Stack

### Backend

| Technology           | Purpose          |
| -------------------- | ---------------- |
| Node.js + TypeScript | Runtime          |
| Fastify              | Web framework    |
| Prisma ORM           | Database ORM     |
| PostgreSQL           | Database         |
| JWT                  | Authentication   |
| bcryptjs             | Password hashing |

### Frontend

| Technology  | Purpose         |
| ----------- | --------------- |
| Next.js 16  | React framework |
| TypeScript  | Type safety     |
| CSS Modules | Styling         |
| Axios       | HTTP client     |

### AI & Voice

| Technology            | Purpose                           |
| --------------------- | --------------------------------- |
| Google Gemini 2.5     | AI agent reasoning + tool calling |
| Deepgram Nova-3       | Speech to text (STT)              |
| ElevenLabs Flash v2.5 | Text to speech (TTS)              |

### DevOps

| Technology     | Purpose                       |
| -------------- | ----------------------------- |
| Docker         | Containerization              |
| Docker Compose | Multi-container orchestration |

---

## 🗄️ Database Schema

```
users                  — patient accounts
doctors                — doctor profiles + status
admins                 — admin accounts
specializations        — medical specializations
doctor_specializations — doctor ↔ specialization mapping
doctor_availability    — working days and hours
doctor_leaves          — leave/holiday management
appointments           — bookings with full lifecycle
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 10+

### 1. Clone the repo

```bash
git clone https://github.com/nagaladinnemahesh/voxicare.git
cd voxicare
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `apps/server/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/voxicare"
JWT_SECRET="your_jwt_secret"
GEMINI_API_KEY="your_gemini_key"
DEEPGRAM_API_KEY="your_deepgram_key"
ELEVENLABS_API_KEY="your_elevenlabs_key"
PORT=3001
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Set up database

```bash
cd apps/server
npx prisma migrate dev
```

### 5. Start development servers

```bash
# Terminal 1 — Backend
cd apps/server && npm run dev

# Terminal 2 — Frontend
cd apps/web && npm run dev
```

### 6. Run with Docker

```bash
docker compose up --build
```

---

## 📁 Project Structure

```
voxicare/
├── apps/
│   ├── server/                   # Fastify backend
│   │   ├── src/
│   │   │   ├── config/           # DB + env config
│   │   │   ├── middlewares/      # JWT auth middleware
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Patient + doctor auth
│   │   │   │   ├── doctors/      # Doctor routes + dashboard
│   │   │   │   ├── appointments/ # Booking management
│   │   │   │   ├── agent/        # Gemini AI agent + tools
│   │   │   │   ├── voice/        # STT + TTS endpoints
│   │   │   │   └── admin/        # Admin panel APIs
│   │   │   └── server.ts         # Entry point
│   │   └── prisma/               # Schema + migrations
│   └── web/                      # Next.js frontend
│       └── app/
│           ├── page.tsx          # Landing page
│           ├── login/            # Patient login
│           ├── register/         # Patient + doctor register
│           ├── dashboard/        # Patient dashboard + Voxia
│           ├── doctor/           # Doctor portal
│           └── admin/            # Admin portal
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

### Auth

```
POST /api/auth/patient/register
POST /api/auth/patient/login
POST /api/auth/doctor/register
POST /api/auth/doctor/login
```

### Doctors

```
GET  /api/doctors
GET  /api/doctors/:id
GET  /api/doctors/specializations
GET  /api/doctors/:id/availability
```

### Appointments

```
POST /api/appointments
GET  /api/appointments
PUT  /api/appointments/:id/cancel
PUT  /api/appointments/:id/reschedule
```

### AI Agent

```
POST /api/agent/chat
```

### Voice

```
POST /api/voice/chat
POST /api/voice/tts
```

### Admin

```
POST /api/admin/login
GET  /api/admin/stats
GET  /api/admin/doctors
PUT  /api/admin/doctors/:id/status
GET  /api/admin/patients
GET  /api/admin/appointments
```

### Doctor Dashboard

```
GET  /api/doctors/me/profile
GET  /api/doctors/me/appointments
PUT  /api/doctors/me/availability
POST /api/doctors/me/leave
PUT  /api/doctors/me/appointments/:id/status
```

---

## 👥 Portals

| Portal  | URL             | Credentials                |
| ------- | --------------- | -------------------------- |
| Patient | `/login`        | Register to create account |
| Doctor  | `/doctor/login` | Register as doctor         |
| Admin   | `/admin/login`  | `admin@voxicare.com`       |

---

## 🗺️ Roadmap

- [ ] AWS EC2 deployment
- [ ] GitHub Actions CI/CD
- [ ] Nginx + SSL
- [ ] Email notifications
- [ ] Payment integration
- [ ] Mobile app

---

## 👨‍💻 Author

**Mahesh Nagaladinna**

- GitHub: [@nagaladinnemahesh](https://github.com/nagaladinnemahesh)

---
