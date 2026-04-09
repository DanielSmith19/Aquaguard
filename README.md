# AquaGuard 🌊

**Pool operations, workforce management, and compliance — purpose-built for aquatic businesses.**

AquaGuard is a full-stack SaaS platform that replaces paper logs, group chats, and manual spreadsheets for pool companies. It combines real-time pool monitoring, AI-powered maintenance assistance, staff scheduling, payroll, HR, and member management into one connected system — scoped per organization with full data isolation.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [API Overview](#api-overview)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

AquaGuard was built from firsthand experience working as a lifeguard at a multi-pool company. The core problems it solves:

- Lifeguards had no way to see what the previous shift had done at a pool
- Chemical issues required waiting for a manager to come on-site
- No digital member verification or capacity tracking
- Scheduling and payroll were managed in disconnected spreadsheets
- Compliance logs were paper-based and hard to retrieve for inspections

AquaGuard addresses all of these in one platform, accessible on any device via web browser with a native-quality mobile experience.

---

## Features

### Pool Operations
- **Shared pool logbooks** — shift history, chemical logs, and notes that follow the pool, not the person
- **Daily shift checklist** — standardized tasks with timestamps and staff attribution, resets each day
- **Chemical monitoring** — log pH, chlorine, alkalinity, and temperature with automatic tiered alerts
- **Tiered alert system** — yellow (monitor), orange (action needed), red (immediate) alerts pushed to managers
- **AI maintenance assistant** — powered by Claude API, answers any pool chemistry or equipment question instantly
- **Incident reporting** — timestamped reports with photo attachments, severity classification, manager sign-off, and PDF export
- **Equipment maintenance tracker** — service schedules, fault reporting, and warranty tracking per piece of equipment

### Workforce Management
- **Scheduling** — weekly shift builder with pool-to-staff assignment, conflict detection, and shift swap requests
- **Time and attendance** — GPS-verified clock-in/out, break tracking, late alerts, timesheet approval
- **Payroll** — automatic hours calculation, overtime, pay period summaries, and CSV/PDF export
- **HR module** — employee profiles, certification tracking (CPR, lifeguard license, first aid), document storage, onboarding checklists, and performance notes
- **Employee self-service** — view schedules, submit time-off requests, upload certifications, update availability

### Access Control
- **Location-based login** — GPS geofencing ensures staff can only clock in when physically at their assigned pool
- **Schedule-enforced login** — login is locked outside of scheduled shift hours
- **Role-based UI** — lifeguards, managers, regional managers, and admins each see a different interface based on their role, determined automatically at login via employee ID

### Member Management
- **Member portal** — separate login for pool patrons with digital membership cards and QR code check-in
- **Real-time capacity display** — members can check pool occupancy before visiting
- **Lane and facility booking** — reserve time slots up to 7 days in advance
- **Membership payments** — Stripe-powered membership purchase and renewal
- **Swim program booking** — enroll in lessons and programs, track attendance and progress

### Compliance and Safety
- **Compliance audit logs** — auto-generated daily and weekly compliance reports, exportable as PDF for health department inspections
- **Certification expiry alerts** — 60, 30, and 7-day warnings for CPR, lifeguard licenses, and first aid certs; blocks shift login if expired
- **Weather and lightning monitoring** — real-time lightning detection with automatic mandatory closure alerts and legal closure logging
- **Immutable audit trail** — every action logged with timestamp, user ID, and IP address

### Analytics
- **Pool performance dashboard** — chemical compliance scores, checklist completion rates, incident trends
- **Workforce analytics** — hours worked, overtime costs, late clock-ins, certification compliance rates
- **Financial overview** — payroll cost by pool, by period, and as a percentage of revenue
- **PDF report export** — full analytics reports for facility owners and boards

### Multi-tenancy
- **Organization registration** — pool companies register their own workspace and receive a unique org code
- **Full data isolation** — every record is scoped by `org_id`; no organization can ever access another's data
- **Multi-location support** (Enterprise) — regional manager role, aggregate dashboards across locations, org-wide standardized checklists

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Mobile | React Native + Expo (planned) |
| Backend | Node.js, Express |
| Primary database | PostgreSQL |
| Live sync | Firebase Realtime Database |
| Session / caching | Redis |
| Payments | Stripe |
| Push notifications | Firebase Cloud Messaging (FCM) / APNs |
| AI assistant | Anthropic Claude API (`claude-sonnet-4-6`) |
| Weather / lightning | Tomorrow.io API |
| Charts | Recharts |
| PDF generation | pdfkit |
| Deployment | Railway (API), Vercel (frontend) |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 15 or higher
- Redis
- A Firebase project with Realtime Database enabled
- An Anthropic API key
- A Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aquaguard.git
cd aquaguard

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Database setup

```bash
# Create the database
createdb aquaguard

# Run migrations
cd server
npm run migrate
```

### Running locally

```bash
# Start the backend (from /server)
npm run dev

# Start the frontend (from /client)
npm run dev
```

The frontend will run on `http://localhost:5173` and the API on `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the `/server` directory:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/aquaguard

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_jwt_secret_here

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Weather
TOMORROW_IO_API_KEY=your_tomorrow_io_api_key

# App
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `/client` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

> **Never commit `.env` files to GitHub.** They are listed in `.gitignore` by default.

---

## Project Structure

```
aquaguard/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page-level components
│   │   │   ├── auth/         # Login, org registration
│   │   │   ├── dashboard/    # Role-specific dashboards
│   │   │   ├── pools/        # Pool logbooks and checklists
│   │   │   ├── scheduling/   # Shift scheduling
│   │   │   ├── payroll/      # Payroll and timesheets
│   │   │   ├── hr/           # HR and certifications
│   │   │   ├── members/      # Member portal
│   │   │   ├── compliance/   # Audit logs and reports
│   │   │   └── analytics/    # Reporting dashboards
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # Auth and org context
│   │   └── utils/            # Helpers and API client
│   └── public/
│
├── server/                   # Node.js + Express backend
│   ├── routes/               # API route handlers
│   │   ├── auth.js
│   │   ├── pools.js
│   │   ├── staff.js
│   │   ├── scheduling.js
│   │   ├── payroll.js
│   │   ├── hr.js
│   │   ├── members.js
│   │   ├── compliance.js
│   │   ├── incidents.js
│   │   ├── equipment.js
│   │   └── analytics.js
│   ├── middleware/            # Auth, org scoping, rate limiting
│   ├── db/                   # PostgreSQL queries and migrations
│   ├── services/             # External API integrations
│   │   ├── claude.js         # AI assistant
│   │   ├── stripe.js         # Payments
│   │   ├── weather.js        # Lightning monitoring
│   │   ├── firebase.js       # Real-time sync and notifications
│   │   └── pdf.js            # Report generation
│   └── index.js              # Express app entry point
│
├── .github/
│   └── workflows/            # GitHub Actions CI/CD
├── .gitignore
├── README.md
└── package.json
```

---

## User Roles

| Role | Access |
|---|---|
| **Lifeguard** | Own pool logbook, checklist, AI assistant, incident logging, member QR scan, own schedule and timesheets |
| **Manager** | Everything above + all pools in their org, team scheduling, alert dashboard, payroll approval, HR profiles |
| **Regional Manager** | Everything above + aggregate view across multiple locations (Enterprise) |
| **Admin** | Full system access including org settings, billing, user management, API keys, and compliance exports |

Role is determined automatically at login by matching the employee ID against the company database. The UI renders entirely based on role — restricted screens are never loaded, not just hidden.

---

## API Overview

All API routes are prefixed with `/api/v1`. Every request requires a valid JWT token in the `Authorization` header. All queries are automatically scoped to the authenticated user's `org_id` by middleware.

```
POST   /api/v1/auth/verify-id          # Verify employee ID + org code
POST   /api/v1/auth/login              # Issue JWT token

GET    /api/v1/pools                   # List all pools in org
GET    /api/v1/pools/:id/readings      # Chemical readings for a pool
POST   /api/v1/pools/:id/readings      # Log a new chemical reading
GET    /api/v1/pools/:id/checklist     # Today's checklist for a pool
PATCH  /api/v1/pools/:id/checklist/:item  # Mark checklist item complete

GET    /api/v1/staff                   # List all staff in org
POST   /api/v1/staff                   # Add a new employee
GET    /api/v1/staff/:id               # Employee profile
PATCH  /api/v1/staff/:id               # Update employee

GET    /api/v1/schedules               # Weekly schedule for org
POST   /api/v1/schedules               # Create a shift
POST   /api/v1/schedules/swap          # Request a shift swap

POST   /api/v1/attendance/clock-in     # GPS-verified clock-in
POST   /api/v1/attendance/clock-out    # Clock-out
GET    /api/v1/attendance/timesheets   # Timesheets for pay period

GET    /api/v1/payroll/summary         # Pay period summary
POST   /api/v1/payroll/run             # Finalize and export payroll

POST   /api/v1/incidents               # Log a new incident
GET    /api/v1/incidents               # List incidents for org
GET    /api/v1/incidents/:id/pdf       # Export incident PDF

GET    /api/v1/compliance/report       # Generate compliance report
GET    /api/v1/compliance/report/pdf   # Export compliance PDF

POST   /api/v1/assistant               # Query the AI maintenance assistant
```

Enterprise API key access is documented at `/api/docs` (Swagger UI).

---

## Roadmap

### Current — MVP
- [x] Multi-tenant org registration and login
- [x] Pool logbooks and shift checklists
- [x] Chemical monitoring with tiered alerts
- [x] GPS geofencing and schedule-enforced login
- [x] Role-based UI rendering
- [x] AI maintenance assistant
- [x] HR module with certification tracking
- [x] Scheduling and shift management
- [x] Time and attendance with GPS clock-in
- [x] Payroll calculation and export
- [x] Employee self-service portal

### Next — Pro tier
- [ ] Compliance audit logs and PDF export
- [ ] Enhanced incident reporting with photos and sign-off
- [ ] Member portal with QR check-in
- [ ] Swim lesson and program booking
- [ ] Weather and lightning monitoring
- [ ] Equipment maintenance tracker
- [ ] Analytics and reporting dashboard

### Future — Enterprise tier
- [ ] Direct payroll processing via Stripe
- [ ] Multi-location and regional manager support
- [ ] Public REST API with API key management
- [ ] Smart pool sensor integration (Fluidra, Pentair, Hayward)
- [ ] QuickBooks sync
- [ ] Zapier integration

---

## Contributing

AquaGuard is currently in active development. If you have domain expertise in aquatic operations, pool chemistry, or workforce management and want to contribute to the product direction, reach out via the contact below.

For code contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m 'add: brief description of change'`)
4. Push to your branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request with a clear description of what you built and why

Please scope all database queries by `org_id` and never expose cross-org data. All new routes must pass through the auth and org-scoping middleware.

---

## License

This project is proprietary and confidential. All rights reserved.

&copy; 2026 AquaGuard. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

*Built from real experience on the pool deck. Designed for the people who keep swimmers safe.*
