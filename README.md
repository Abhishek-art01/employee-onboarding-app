# 🚀 Employee Onboarding System

A production-grade, full-stack web application for automating employee onboarding — built with **Node.js + Express**, **React.js**, **PostgreSQL**, **Docker**, and **Kubernetes**.

---

## 📁 Project Structure

```
employee-onboarding-app/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Business logic handlers
│   │   │   ├── authController.js
│   │   │   ├── onboardingController.js
│   │   │   ├── documentController.js
│   │   │   ├── verificationController.js
│   │   │   └── adminController.js
│   │   ├── routes/             # Express route definitions
│   │   │   ├── auth.js         # POST /api/auth/*
│   │   │   ├── onboarding.js   # /api/onboarding/*
│   │   │   ├── documents.js    # /api/documents/*
│   │   │   ├── verification.js # /api/verification/*
│   │   │   ├── admin.js        # /api/admin/*
│   │   │   └── audit.js        # /api/audit/*
│   │   ├── models/             # Data access layer
│   │   │   ├── User.js
│   │   │   ├── OnboardingForm.js
│   │   │   └── Document.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT + RBAC
│   │   │   ├── auditLogger.js  # Every request logged to DB
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── utils/
│   │   │   ├── db.js           # PostgreSQL pool
│   │   │   ├── logger.js       # Winston logger
│   │   │   ├── encryption.js   # AES-256-CBC
│   │   │   ├── otp.js          # OTP generation + email
│   │   │   ├── apiWrapper.js   # Aadhaar/PAN/Bank stubs
│   │   │   └── s3Upload.js     # AWS S3 integration
│   │   └── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FormWizard.js   # 6-step stepper
│   │   │   ├── Dashboard.js    # Recharts stats
│   │   │   ├── DocViewer.js    # Document table
│   │   │   ├── SearchBar.js    # Filter + search
│   │   │   └── Layout.js       # Sidebar + navbar
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── OnboardingForm.js
│   │   │   ├── DocumentUpload.js
│   │   │   ├── AdminReview.js
│   │   │   └── NotFound.js
│   │   ├── services/           # Axios API calls
│   │   │   ├── api.js          # Base instance + interceptors
│   │   │   ├── authService.js
│   │   │   ├── onboardingService.js
│   │   │   ├── documentService.js
│   │   │   └── verificationService.js
│   │   └── App.js              # Routes + AuthContext + MUI theme
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── database/
│   ├── init.sql                # Schema + seed
│   └── migrations/
│       ├── 001_add_employee_code.sql
│       ├── 002_add_notifications.sql
│       └── 003_add_audit_partitions.sql
├── k8s/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-deployment.yaml
│   ├── services.yaml
│   └── ingress.yaml
├── docker-compose.yaml
└── README.md
```

---

## ✨ Features

| Feature | Details |
|---|---|
| **2-Factor Auth** | Email OTP on every login + registration |
| **Role-Based Access** | `super_admin` › `hr_admin` › `hr_executive` › `manager` › `employee` |
| **Multi-step Onboarding** | 6-step wizard: Personal → Education → Employment → Bank → Emergency → Consent |
| **Identity Verification** | Aadhaar, PAN, Bank Account (stub → real API in production) |
| **Document Upload** | Drag-and-drop → AWS S3 with AES-256 server-side encryption |
| **HR Review Dashboard** | Approve, reject, request correction with reviewer notes |
| **Audit Logging** | Every API call logged to partitioned `audit_logs` table |
| **AES-256 Encryption** | Aadhaar, PAN, bank account numbers encrypted at rest |
| **GDPR Consent** | Explicit consent checkboxes stored per-user |
| **Responsive UI** | Material-UI v5 with mobile-first sidebar layout |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js 20, Express 4, PostgreSQL 16 |
| **Frontend** | React 18, Material-UI v5, React Router v6, Recharts |
| **Auth** | JWT (access + refresh tokens), bcrypt (12 rounds) |
| **Storage** | AWS S3 (presigned URLs, server-side AES-256) |
| **Encryption** | Node.js `crypto` — AES-256-CBC with random IV per field |
| **Email** | Nodemailer (SMTP) — OTP delivery |
| **Logging** | Winston (structured JSON in prod, coloured in dev) |
| **Container** | Docker multi-stage builds, Nginx reverse proxy |
| **Orchestration** | Kubernetes (Deployments, StatefulSet, HPA, Ingress) |

---

## 🚀 Quick Start — Local Development

### Prerequisites
- Node.js ≥ 18
- PostgreSQL 14+ running locally  **or** Docker Desktop

---

### Option A — Without Docker (bare metal)

#### 1. Database setup
```bash
psql -U postgres -c "CREATE DATABASE onboarding_db;"
psql -U postgres -d onboarding_db -f database/init.sql
psql -U postgres -d onboarding_db -f database/migrations/001_add_employee_code.sql
psql -U postgres -d onboarding_db -f database/migrations/002_add_notifications.sql
```

#### 2. Backend
```bash
cd backend
cp .env .env.local          # edit values as needed
npm install
npm run dev                 # starts on :5000 with nodemon
```

#### 3. Frontend
```bash
cd frontend
npm install
npm start                   # starts on :3000 (proxies /api → :5000)
```

---

### Option B — Docker Compose (recommended)

```bash
# Clone and build
cd employee-onboarding-app
docker-compose up --build

# First run: DB initialised automatically via init.sql
# Backend  → http://localhost:5000
# Frontend → http://localhost:3000
# DB       → localhost:5432
```

To rebuild after code changes:
```bash
docker-compose up --build --force-recreate
```

To stop and remove volumes:
```bash
docker-compose down -v
```

---

## 🔑 Default Admin Credentials

| Email | Password | Role |
|---|---|---|
| `admin@company.com` | `Admin@1234` | `super_admin` |

> ⚠️ **Change this password immediately in production!**

---

## 🌐 API Documentation

Base URL: `http://localhost:5000/api`

All authenticated routes require: `Authorization: Bearer <token>`

---

### Auth Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register new employee |
| `POST` | `/auth/verify-email` | ❌ | Verify email OTP |
| `POST` | `/auth/login` | ❌ | Login (sends OTP) |
| `POST` | `/auth/verify-otp` | ❌ | Verify login OTP → returns JWT |
| `POST` | `/auth/refresh` | ❌ | Refresh access token |
| `POST` | `/auth/forgot-password` | ❌ | Send password reset OTP |
| `POST` | `/auth/reset-password` | ❌ | Reset password with OTP |
| `POST` | `/auth/logout` | ✅ | Revoke refresh token |
| `GET`  | `/auth/me` | ✅ | Get current user profile |

**Register body:**
```json
{
  "email": "john.doe@company.com",
  "password": "Secure@123",
  "fullName": "John Doe",
  "phone": "9876543210",
  "department": "Engineering"
}
```

---

### Onboarding Routes

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST`  | `/onboarding` | ✅ | any | Create blank form |
| `GET`   | `/onboarding/my` | ✅ | any | Get own form |
| `PATCH` | `/onboarding/step/:step` | ✅ | any | Save a step |
| `GET`   | `/onboarding/all` | ✅ | HR | Get all forms |
| `GET`   | `/onboarding/stats` | ✅ | HR | Dashboard stats |
| `GET`   | `/onboarding/:id` | ✅ | HR | Get form (decrypted) |
| `PATCH` | `/onboarding/:id/review` | ✅ | HR | Approve / reject |

**Save step example (`/onboarding/step/personal`):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1995-06-15",
  "gender": "male",
  "aadhaarNumber": "123456789012",
  "panNumber": "ABCDE1234F",
  "mobile": "9876543210",
  "currentAddress": "123 Main Street",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pinCode": "560001"
}
```

Valid step values: `personal` | `education` | `employment` | `bank` | `emergency` | `consent`

---

### Document Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST`  | `/documents/upload` | ✅ | Upload file (multipart/form-data) |
| `GET`   | `/documents/my` | ✅ | List my documents |
| `GET`   | `/documents/user/:userId` | ✅ HR | List user's documents |
| `GET`   | `/documents/:id/download` | ✅ | Get presigned S3 URL |
| `PATCH` | `/documents/:id/verify` | ✅ HR | Verify or reject document |
| `DELETE`| `/documents/:id` | ✅ | Delete document |

**Upload body (form-data):**
```
document   : <file>
docType    : "aadhaar_front"
formId     : 1          (optional)
```

---

### Verification Routes

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/verification/aadhaar` | ✅ | Verify Aadhaar number |
| `POST` | `/verification/pan` | ✅ | Verify PAN number |
| `POST` | `/verification/bank` | ✅ | Verify bank account (penny drop) |
| `GET`  | `/verification/status` | ✅ | Get user's verification history |

> In development mode (`NODE_ENV=development`), all verifications return **mock responses** and no real API is called. Replace with actual UIDAI / IT Dept / bank APIs in production.

---

### Admin Routes

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET`   | `/admin/users` | ✅ | hr_admin+ | List all users |
| `GET`   | `/admin/users/:id` | ✅ | hr_admin+ | Get user by ID |
| `PATCH` | `/admin/users/:id/role` | ✅ | super_admin | Update user role |
| `PATCH` | `/admin/users/:id/deactivate` | ✅ | hr_admin+ | Deactivate user |
| `GET`   | `/admin/stats` | ✅ | hr_admin+ | System statistics |

---

### Audit Route

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/audit?userId=&method=&from=&to=&page=` | ✅ | hr_admin+ | Query audit logs |

---

## ☸️ Kubernetes Deployment

### Prerequisites
- `kubectl` configured for your cluster
- Container registry (ECR / GCR / ACR)
- `cert-manager` installed for TLS
- `nginx-ingress-controller` installed

### Steps

#### 1. Build and push images
```bash
# Backend
docker build -t your-registry/onboarding-backend:v1.0.0 ./backend
docker push your-registry/onboarding-backend:v1.0.0

# Frontend
docker build -t your-registry/onboarding-frontend:v1.0.0 ./frontend
docker push your-registry/onboarding-frontend:v1.0.0
```

#### 2. Update image references
Edit `k8s/backend-deployment.yaml` and `k8s/frontend-deployment.yaml`:
```yaml
image: your-registry/onboarding-backend:v1.0.0
image: your-registry/onboarding-frontend:v1.0.0
```

#### 3. Update secrets
Edit `k8s/backend-deployment.yaml` → `Secret` section with real credentials.

#### 4. Deploy to Kubernetes
```bash
# Create namespace + deploy all
kubectl apply -f k8s/

# Verify pods
kubectl get pods -n onboarding

# Watch rollout
kubectl rollout status deployment/backend -n onboarding
kubectl rollout status deployment/frontend -n onboarding

# Check logs
kubectl logs -l app=backend -n onboarding --tail=100

# Scale manually
kubectl scale deployment backend --replicas=4 -n onboarding
```

#### 5. Run database migrations
```bash
# One-time init job (or exec into backend pod)
kubectl exec -it deployment/backend -n onboarding -- \
  sh -c "psql $DATABASE_URL -f /app/migrations/init.sql"
```

---

## ☁️ Cloud Hosting Guide

### AWS EKS

```bash
# Create EKS cluster
eksctl create cluster --name onboarding-cluster \
  --region ap-south-1 --nodegroup-name standard-workers \
  --node-type t3.medium --nodes 3

# Configure kubectl
aws eks update-kubeconfig --region ap-south-1 --name onboarding-cluster

# Install nginx ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Deploy app
kubectl apply -f k8s/

# Get LoadBalancer URL
kubectl get svc frontend-service -n onboarding
```

**AWS RDS** (recommended over in-cluster PostgreSQL):
- Create RDS PostgreSQL 16 instance in same VPC
- Update `DB_HOST` in `backend-config` ConfigMap to RDS endpoint
- Remove `postgres-deployment.yaml` from cluster

**AWS S3**:
- Create S3 bucket `employee-onboarding-docs-prod`
- Enable server-side encryption (AES-256)
- Create IAM role for EKS service account (IRSA)
- Update `S3_BUCKET_NAME` and `AWS_REGION` in ConfigMap

---

### Google GKE

```bash
# Create GKE cluster
gcloud container clusters create onboarding-cluster \
  --region=asia-south1 --num-nodes=3 --machine-type=e2-medium

# Connect kubectl
gcloud container clusters get-credentials onboarding-cluster --region=asia-south1

# Push to GCR
docker tag onboarding-backend:v1.0 gcr.io/YOUR_PROJECT/onboarding-backend:v1.0
docker push gcr.io/YOUR_PROJECT/onboarding-backend:v1.0

# Deploy
kubectl apply -f k8s/
```

---

### Azure AKS

```bash
# Create AKS cluster
az aks create --resource-group OnboardingRG --name onboardingCluster \
  --node-count 3 --node-vm-size Standard_B2s --generate-ssh-keys

# Connect kubectl
az aks get-credentials --resource-group OnboardingRG --name onboardingCluster

# Push to ACR
az acr build --registry yourRegistry --image onboarding-backend:v1.0 ./backend

# Deploy
kubectl apply -f k8s/
```

---

## 🔒 Security Checklist

- [x] Passwords hashed with **bcrypt** (12 rounds)
- [x] JWT access tokens (8h) + refresh tokens (7d) with DB-backed revocation
- [x] **2FA**: OTP on every login via email
- [x] **AES-256-CBC** encryption for Aadhaar, PAN, bank account at rest
- [x] Rate limiting on all auth + verification routes
- [x] RBAC on every protected route
- [x] Helmet.js security headers (CSP, HSTS, XSS protection)
- [x] Request body sanitisation (sensitive fields redacted in audit logs)
- [x] S3 server-side encryption + presigned URL access (15 min expiry)
- [x] GDPR consent: explicit per-purpose consent stored with timestamp + IP
- [x] Audit log of every API call (user, IP, method, path, status, duration)
- [x] Non-root Docker containers
- [x] Kubernetes `runAsNonRoot: true` + `securityContext`
- [x] PostgreSQL connections over SSL in production
- [ ] Enable `HSTS` in nginx for production (add `Strict-Transport-Security` header)
- [ ] Rotate `JWT_SECRET` and `ENCRYPTION_KEY` quarterly
- [ ] Enable AWS CloudTrail for S3 access logging
- [ ] Configure WAF (AWS WAF / Cloudflare) in front of the ingress

---

## ⚙️ Environment Variables Reference

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | ✅ | Server port (default: 5000) |
| `DB_HOST` | ✅ | PostgreSQL host |
| `DB_NAME` | ✅ | Database name |
| `DB_USER` | ✅ | DB username |
| `DB_PASSWORD` | ✅ | DB password |
| `JWT_SECRET` | ✅ | Min 32 chars — used for all token signing |
| `JWT_EXPIRES_IN` | ✅ | e.g. `8h` |
| `ENCRYPTION_KEY` | ✅ | 32-byte hex key for AES-256 |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | ✅ | AWS secret key |
| `AWS_REGION` | ✅ | e.g. `ap-south-1` |
| `S3_BUCKET_NAME` | ✅ | S3 bucket name |
| `SMTP_HOST` | ✅ | SMTP server host |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASS` | ✅ | SMTP password |
| `AADHAAR_API_KEY` | prod | UIDAI API key |
| `PAN_API_KEY` | prod | PAN verification API key |
| `BANK_API_KEY` | prod | Bank verification API key |
| `FRONTEND_URL` | ✅ | Frontend origin for CORS |

---

## 🗄️ Database Schema Overview

| Table | Purpose |
|---|---|
| `users` | All accounts — employees, HR, admins |
| `refresh_tokens` | JWT refresh token hashes |
| `otp_tokens` | Hashed OTPs with expiry and purpose |
| `onboarding_forms` | JSONB form data, status, reviewer info |
| `documents` | File metadata + S3 key references |
| `verification_logs` | Aadhaar/PAN/bank verification history |
| `audit_logs` | Partitioned table — every API request |
| `consent_records` | GDPR consent per user per purpose |
| `notifications` | In-app notifications (migration 002) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 Licence

MIT — © 2025 Your Company Ltd.
