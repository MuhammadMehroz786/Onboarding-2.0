# 🚀 Getting Started Guide

This guide will help you set up your Onboarding Automation Platform from scratch.

## Prerequisites

- Node.js 18+ installed
- Railway account ([railway.app](https://railway.app))
- Git installed (optional, for deployment)

---

## Step 1: Set Up Railway PostgreSQL Database

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create a New Project**
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Wait for database to provision (~30 seconds)

3. **Get Database Connection String**
   - Click on your PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` value
   - It should look like: `postgresql://postgres:password@host.railway.app:5432/railway`

---

## Step 2: Configure Environment Variables

1. Open `.env` file in your project root
2. Replace `DATABASE_URL` with your Railway connection string:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@containers-us-west-XXX.railway.app:5432/railway"
```

3. Generate secure secrets for NextAuth and N8N:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate N8N_CALLBACK_SECRET
openssl rand -base64 32
```

4. Update `.env` with generated secrets:

```env
NEXTAUTH_SECRET="your-generated-secret-here"
N8N_CALLBACK_SECRET="your-generated-secret-here"
```

5. If you have N8N set up, add the webhook URL. Otherwise, leave it as is for now:

```env
N8N_ONBOARDING_WEBHOOK_URL="https://your-n8n-instance.com/webhook/onboarding"
```

---

## Step 3: Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

You should see output like:
```
✔ Generated Prisma Client
Your database is now in sync with your schema.
```

---

## Step 4: Create an Admin User

You have two options:

### Option A: Using Prisma Studio (Easiest)

1. Open Prisma Studio:
```bash
npx prisma studio
```

2. Browser will open at `http://localhost:5555`
3. Click on "User" model
4. Click "Add record"
5. Fill in:
   - email: `admin@youragency.com`
   - passwordHash: You'll need to hash a password first (see Option B)
   - role: `admin`
6. Save

### Option B: Using SQL (Recommended)

1. First, hash your admin password:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourSecurePassword123', 10).then(hash => console.log(hash));"
```

2. Connect to your Railway database:
   - In Railway dashboard, click "PostgreSQL"
   - Click "Data" tab
   - Or use a SQL client like TablePlus, Postico, or pgAdmin

3. Run this SQL:
```sql
INSERT INTO users (id, email, password_hash, role)
VALUES (
  gen_random_uuid(),
  'admin@youragency.com',
  '$2b$10$YOUR_HASHED_PASSWORD_HERE',
  'admin'
);
```

---

## Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the landing page with three options:
- **Start Onboarding** (for new clients)
- **Client Login** (for existing clients)
- **Admin Access** (for your agency team)

---

## Step 6: Test the System

### Test Client Onboarding

1. Click "Start Onboarding"
2. Fill out the 7-step wizard
3. Create an account in Step 8
4. Submit the form

**What happens:**
- User account is created with hashed password
- Client profile is saved with all onboarding data
- Data is sent to N8N webhook (if configured)
- You get a success message

### Test Admin Login

1. Go back to homepage
2. Click "Admin Access"
3. Login with:
   - Email: `admin@youragency.com`
   - Password: Whatever you set in Step 4

**What you'll see:**
- Admin dashboard with all clients
- Click on a client to see their full onboarding responses
- View generated links (once N8N sends them back)

### Test Client Login

1. Go back to homepage
2. Click "Client Login"
3. Login with the email/password you created during onboarding

**What you'll see:**
- Client dashboard
- Status: "Pending" (until N8N sends links)
- Once links are generated, they'll appear here

---

## Step 7: Set Up N8N Integration (Optional)

### Outbound Webhook (App → N8N)

When a client completes onboarding, your app sends data to N8N.

1. In your N8N instance, create a new workflow
2. Add a "Webhook" node
3. Set method to POST
4. Copy the webhook URL
5. Update `.env`:
```env
N8N_ONBOARDING_WEBHOOK_URL="https://your-n8n.app.n8n.cloud/webhook/onboarding"
```

**Payload your N8N receives:**
```json
{
  "uniqueClientId": "CL-ABC123",
  "clientId": "uuid",
  "email": "client@example.com",
  "companyName": "Acme Corp",
  "onboardingData": { ... }
}
```

### Inbound Webhook (N8N → App)

After N8N generates links, it sends them back to your app.

1. In your N8N workflow, add an HTTP Request node at the end
2. Configure it to POST to:
```
http://localhost:3000/api/webhooks/n8n/callback
```
(In production, use your Railway URL)

3. Set the body to:
```json
{
  "uniqueClientId": "{{ $json.uniqueClientId }}",
  "clientId": "{{ $json.clientId }}",
  "secret": "your-n8n-callback-secret",
  "links": [
    {
      "type": "google_doc",
      "title": "Marketing Strategy",
      "url": "https://docs.google.com/document/d/...",
      "description": "Your personalized marketing strategy",
      "icon": "FileText"
    }
  ]
}
```

---

## Step 8: Deploy to Railway (Production)

### Prerequisites
- Push your code to GitHub
- Railway account connected to GitHub

### Deployment Steps

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Create Railway Project**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Next.js

3. **Add Environment Variables**
   - In Railway project settings → Variables
   - Add all variables from `.env`
   - **Important:** Update these for production:
     - `DATABASE_URL` → Use Railway PostgreSQL connection string
     - `NEXTAUTH_URL` → Your Railway app URL (e.g., `https://your-app.up.railway.app`)
     - `NEXT_PUBLIC_APP_URL` → Same as NEXTAUTH_URL

4. **Update Build Command**
   - In Railway settings → Build
   - Set build command to:
   ```
   prisma generate && prisma migrate deploy && next build
   ```

5. **Deploy!**
   - Railway will automatically deploy
   - Every push to `main` triggers a new deployment
   - Get your public URL from Railway dashboard

6. **Run Initial Migration**
   - After first deployment, create admin user in production database
   - Use Railway's PostgreSQL console or connect via SQL client

---

## Troubleshooting

### "Prisma Client could not be found"
```bash
npx prisma generate
```

### "No DATABASE_URL found"
Check that `.env` file exists and contains valid `DATABASE_URL`

### "Failed to connect to database"
- Verify Railway database is running
- Check DATABASE_URL is correct
- Make sure your IP isn't blocked (Railway allows all IPs by default)

### "NextAuth session not working"
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### N8N webhook not triggering
- Check `N8N_ONBOARDING_WEBHOOK_URL` is correct
- Verify N8N webhook is active
- Check N8N logs for incoming requests
- Look at `n8n_webhook_logs` table in database for error messages

---

## Next Steps

✅ Your onboarding automation is now live!

**What to do next:**
1. Customize the UI to match your agency branding
2. Set up N8N workflows for document generation
3. Configure email notifications
4. Add your agency logo and colors
5. Test end-to-end flow with a real client

**Questions?**
- Check the main README.md for API documentation
- Review the database schema in `prisma/schema.prisma`
- Examine the API routes in `app/api/`

---

**Happy onboarding! 🎉**
