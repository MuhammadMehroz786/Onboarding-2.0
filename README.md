# Onboarding Automation Platform

A comprehensive onboarding automation system for marketing agencies. Streamlines client intake, integrates with N8N workflows, and provides dashboards for both clients and agency admins.

## Features

- ✅ **7-Step Onboarding Wizard** - Comprehensive client information gathering
- ✅ **Secure Authentication** - NextAuth.js with bcrypt password hashing
- ✅ **N8N Integration** - Automated workflow triggers and callbacks
- ✅ **Client Dashboard** - View generated documents, ClickUp boards, and Airtable links
- ✅ **Admin Dashboard** - Manage all clients and view detailed onboarding responses
- ✅ **Activity Logging** - Track client activities and system events
- ✅ **PostgreSQL Database** - Robust data storage with Prisma ORM

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Project Structure

```
onboarding-automation/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth API route
│   │   ├── onboarding/submit/      # Onboarding submission endpoint
│   │   ├── client/dashboard/       # Client dashboard data endpoint
│   │   ├── admin/clients/          # Admin endpoints
│   │   └── webhooks/n8n/callback/  # N8N callback webhook
│   ├── (routes)/                   # UI pages (to be added)
│   └── layout.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   └── auth-utils.ts               # Password hashing & utilities
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/                 # Database migrations
├── types/
│   └── next-auth.d.ts              # NextAuth TypeScript types
├── auth.ts                         # NextAuth configuration
├── prisma.config.ts                # Prisma configuration
└── .env                            # Environment variables
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Railway PostgreSQL Database

1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Add a PostgreSQL database service
4. Copy the `DATABASE_URL` from Railway dashboard

### 3. Configure Environment Variables

Update `.env` file with your Railway database URL:

```env
# Database (Get from Railway)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# N8N Webhooks
N8N_ONBOARDING_WEBHOOK_URL="https://your-n8n-instance.com/webhook/onboarding"
N8N_CALLBACK_SECRET="generate-a-secure-random-secret"

# NextAuth
NEXTAUTH_SECRET="generate-a-secure-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate secure secrets:**
```bash
# For NEXTAUTH_SECRET and N8N_CALLBACK_SECRET
openssl rand -base64 32
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Create an Admin User (Optional)

You'll need to create an admin user manually in the database:

```sql
-- Connect to your Railway PostgreSQL database and run:
INSERT INTO users (id, email, password_hash, role)
VALUES (
  gen_random_uuid(),
  'admin@youragency.com',
  '$2b$10$YourBcryptHashedPassword', -- Use bcrypt to hash your password
  'admin'
);
```

Or use a seed script (create `prisma/seed.ts`).

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Public Endpoints

#### POST `/api/onboarding/submit`
Submit onboarding form and create client account.

**Request Body:**
```json
{
  "email": "client@example.com",
  "password": "securePassword123",
  "companyName": "Acme Corp",
  "industry": "SaaS",
  "websiteUrl": "https://acme.com",
  "primaryGoal": "Increase leads by 20%",
  "idealCustomerProfile": "CTOs at mid-sized companies",
  "monthlyBudgetRange": "$5,000 - $10,000",
  ... // All other onboarding fields
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid",
  "clientId": "uuid",
  "uniqueClientId": "CL-ABC123"
}
```

### Protected Endpoints (Require Authentication)

#### GET `/api/client/dashboard`
Get client dashboard data (client role only).

**Response:**
```json
{
  "client": {
    "id": "uuid",
    "companyName": "Acme Corp",
    "status": "active",
    ...
  },
  "links": {
    "documents": [...],
    "projects": [...],
    "data": [...]
  },
  "stats": {
    "totalLinks": 5,
    "documentCount": 2,
    "projectCount": 1,
    "dataCount": 2
  }
}
```

#### GET `/api/admin/clients`
Get all clients (admin role only).

#### GET `/api/admin/clients/[id]`
Get single client details (admin role only).

### Webhook Endpoints

#### POST `/api/webhooks/n8n/callback`
Receive generated links from N8N automation.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "uniqueClientId": "CL-ABC123",
  "clientId": "uuid",
  "secret": "your-n8n-callback-secret",
  "links": [
    {
      "type": "google_doc",
      "title": "Marketing Strategy Document",
      "url": "https://docs.google.com/document/d/...",
      "description": "Personalized marketing strategy",
      "icon": "FileText",
      "workflowId": "n8n-workflow-123"
    },
    {
      "type": "clickup",
      "title": "Project Board",
      "url": "https://app.clickup.com/...",
      "description": "Task management board",
      "icon": "Layout"
    },
    {
      "type": "airtable",
      "title": "Client Database",
      "url": "https://airtable.com/...",
      "description": "Data repository",
      "icon": "Database"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Links saved successfully",
  "linksCreated": 3,
  "clientId": "uuid"
}
```

## N8N Integration

### Outbound (App → N8N)

When a client completes onboarding, the app sends a webhook to N8N with all client data.

**Webhook URL:** `N8N_ONBOARDING_WEBHOOK_URL`

**Payload Structure:**
```json
{
  "uniqueClientId": "CL-ABC123",
  "clientId": "uuid",
  "email": "client@example.com",
  "companyName": "Acme Corp",
  "industry": "SaaS",
  "websiteUrl": "https://acme.com",
  "onboardingData": {
    "businessInfo": { ... },
    "marketingState": { ... },
    "analytics": { ... },
    "socialMedia": { ... },
    "goals": { ... },
    "audience": { ... },
    "budget": { ... }
  }
}
```

### Inbound (N8N → App)

After N8N generates resources, it should callback to:

**Webhook URL:** `https://your-domain.com/api/webhooks/n8n/callback`

Include the `secret` in the payload for authentication.

## Database Schema

See `prisma/schema.prisma` for the complete schema.

**Key Models:**
- `User` - Authentication (clients + admins)
- `Client` - Client profiles with all onboarding data
- `ClientLink` - Generated resource links (docs, ClickUp, Airtable)
- `ActivityLog` - Client activity tracking
- `N8nWebhookLog` - N8N integration logs
- `BrandAsset` - Future file uploads

## Deployment to Railway

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Railway**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Next.js

3. **Add Environment Variables**
   - In Railway project settings, add all `.env` variables
   - Update `DATABASE_URL` with Railway PostgreSQL connection string
   - Update `NEXTAUTH_URL` with your Railway domain

4. **Run Migrations**
   - Railway will automatically run `npm run build`
   - Add a build command to run migrations:
   ```json
   "build": "prisma generate && prisma migrate deploy && next build"
   ```

5. **Deploy!**
   - Railway will deploy automatically on every push to main

## Next Steps

- [ ] Integrate the UI components with API endpoints
- [ ] Add file upload functionality for brand assets
- [ ] Create email notifications (Resend, SendGrid)
- [ ] Add real-time updates with WebSockets/Pusher
- [ ] Implement search/filter for admin dashboard
- [ ] Add export functionality (CSV, PDF reports)
- [ ] Set up monitoring (Sentry, LogRocket)

## License

Private - Marketing Agency Internal Tool

---

**Built with ❤️ for modern marketing agencies**
