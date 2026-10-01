<div id="hero" align="center">
  <h1>🚛 TECHNOFAY TRANSPORT &amp; LOGISTICS</h1>
  <p><strong>Next-Generation Enterprise Fleet Management, Transport Operations &amp; Haulage Terminal</strong></p>
  <p>
    <a href="#core-modules">Core Modules</a> ·
    <a href="#key-features">Features</a> ·
    <a href="#quickstart">Quickstart</a> ·
    <a href="#architecture">Architecture</a> ·
    <a href="#support--contact">Support &amp; Contact</a>
  </p>
  <hr />
</div>

## About Technofay Transport &amp; Logistics

**Technofay Transport &amp; Logistics** is a high-performance operating system designed for modern freight haulage, road transport, and commercial fleet management. It provides end-to-end operational visibility: from computerized **GST SAC 9965 Bilties / Consignment Notes**, **LR tracking**, **Loading Slips**, **Delivery Challans**, and **Gate Passes**, to real-time **GPS fleet telematics**, **Proof of Delivery (POD)** verification, and automated **WhatsApp status dispatch**.

---

## 🚀 Key Features

* **GST SAC 9965 Compliant Bilties**: Instant creation and PDF generation of professional Consignment Notes, Goods Receipts, and Bilties with multi-tier freight charges (freight, loading, unloading, demurrage, insurance, toll tax, and advance deductions).
* **Multi-Format Logistics Documentation**:
  * Consignment Notes / Bilties (`/v1/bilties/{id}/pdf`)
  * Lorry Receipts / LRs (`/v1/lr-numbers/{id}/pdf`)
  * Loading Advice Slips (`/v1/loading-slips/{id}/pdf`)
  * Security & Depot Gate Passes (`/v1/gate-passes/{id}/pdf`)
* **Real-Time WhatsApp Notifications**: Built-in gateway with support for Interakt and Twilio adapters to automatically send PDFs and delivery updates directly to consignors, consignees, and drivers.
* **Driver & Vehicle Document Compliance**: Track driver licenses, police verifications, medical certificates, vehicle permits, PUCs, fitness certificates, and insurance with automated expiry tracking.
* **Dynamic Fleet Dispatch & Telematics**: Live map tracking, GPS telematics integration, geofencing, service zones, and route optimization.
* **Proof of Delivery (POD) Management**: Collect digital signatures, delivery photos, timestamps, and recipient remarks with instant confirmation.
* **Dual-Interface Terminal**:
  * **Operations Terminal**: Lightning-fast React + Vite + Tailwind interface for dispatchers and billing clerks.
  * **Management Console**: Comprehensive administrative suite for organization settings, user roles, policies, and system configuration.

---

## 📦 Core Modules

| Module | Description |
|---|---|
| **Consignments & Bilties** | Complete consignment lifecycle management from booking to POD closure with multi-point stops and freight charges. |
| **Fleet & Vehicles** | Comprehensive vehicle registry: registration, chassis, engine numbers, payload capacity, and maintenance schedules. |
| **Drivers & Personnel** | Driver roster, verification status, contact details, assigned vehicles, and compliance records. |
| **Dispatch & Tracking** | Live order tracking, waypoint optimization, and driver telemetry via GPS feeds. |
| **Customer Directory** | Consignors, consignees, billing addresses, GSTIN records, and contact directories. |
| **Communications Hub** | Integrated WhatsApp and email messaging for automated document delivery. |

---

## 🛠️ Quickstart

### Prerequisites
* **Docker & Docker Compose v2** (Ensure Docker Desktop is active)
* **Node.js 18+** & **Git**
* At least **4 GB RAM** allocated to Docker

### 1. Launch Services
Run the automated startup script:

```powershell
.\start-technofay.ps1
```

Or start the stack manually with Docker Compose:

```bash
docker compose up -d
```

### 2. Run Database Migrations & Initial Setup
Once containers are running:

```bash
docker compose exec application bash -c "./deploy.sh"
```

### 3. Access Portals
* **Management Console**: [http://localhost:4200](http://localhost:4200)
* **API Server**: [http://localhost:8000](http://localhost:8000)
* **Vite Operations Terminal** (in `frontend/`):
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Runs at [http://localhost:5173](http://localhost:5173).

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Technofay Operations Web UI               │
│  (React 19 + TypeScript + Vite + Tailwind + Zustand)   │
└──────────────────────────┬─────────────────────────────┘
                           │ REST / JSON:API
┌──────────────────────────▼─────────────────────────────┐
│                 Technofay Backend Engine                │
│            (Laravel 10 / PHP 8.2 + FrankePHP)          │
├──────────────────────────┬─────────────────────────────┤
│  • Transport Billing     │  • WhatsApp Gateway         │
│  • Bilty / LR Generator  │  • Driver Compliance        │
│  • POD Verification      │  • Route Optimization       │
└────────────┬─────────────┴─────────────┬───────────────┘
             │                           │
┌────────────▼─────────────┐ ┌───────────▼───────────────┐
│     MySQL 8.0 Storage    │ │   Redis Cache & Queues    │
│  (Transactional Relational) (Broadcasting & Job Queue) │
└──────────────────────────┘ └───────────────────────────┘
```

---

## 🔒 Configuration & Environment

Key environment variables can be configured in `api/.env`:

```env
APP_NAME="Technofay Transport & Logistics"
APP_ENV=production
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=database
DB_PORT=3306
DB_DATABASE=fleetbase
DB_USERNAME=root

MAIL_FROM_ADDRESS=admin.techofay@gmail.com
MAIL_FROM_NAME="Technofay Transport & Logistics"

# WhatsApp Gateway (Interakt / Twilio)
WHATSAPP_PROVIDER=interakt
INTERAKT_API_KEY=your_interakt_api_key
```

---

## 📩 Support & Inquiries

For technical support, custom deployment assistance, or feature requests:

* **Organization**: Technofay Transport & Logistics
* **Contact Email**: [admin.techofay@gmail.com](mailto:admin.techofay@gmail.com)
* **GitHub Repository**: [admintechofay-a11y/Transport_techofay](https://github.com/admintechofay-a11y/Transport_techofay)

---

**Copyright © 2026 Technofay Transport & Logistics.** All rights reserved.
