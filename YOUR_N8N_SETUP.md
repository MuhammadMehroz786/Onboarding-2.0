# Your N8N Setup Guide

Your N8N webhook is configured and ready to receive data!

## ✅ Current Configuration

**Your N8N Webhook URL:**
```
https://n8n.eventplanners.cloud/webhook-test/5413e2e7-0c36-43d5-b711-6e4eaf619812
```

This URL is already configured in your `.env` file and will receive data when clients complete onboarding.

---

## 📥 What Data Will Be Sent to Your Webhook

When a client completes the onboarding form, your N8N webhook will receive a **POST request** with the following payload:

See `SAMPLE_N8N_PAYLOAD.json` for a complete example.

### Key Fields You'll Receive:

| Field | Description | Example |
|-------|-------------|---------|
| `uniqueClientId` | Unique identifier for this client | `CL-KZ1HTJQ2-F3K7OVZ` |
| `clientId` | Database UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | Client's email | `john@acmecorp.com` |
| `companyName` | Company name | `Acme Corp` |
| `industry` | Industry | `SaaS`, `E-commerce`, etc. |
| `websiteUrl` | Website | `https://acme.com` |
| `onboardingData` | All 7 steps of onboarding responses | See below |

### Onboarding Data Structure:

```javascript
onboardingData: {
  businessInfo: {
    companyName, industry, websiteUrl, companyDescription,
    employeeCount, businessModel
  },
  marketingState: {
    workedWithAgency, currentChannels, marketingFeedback,
    primaryChallenges
  },
  analytics: {
    hasGoogleAnalytics, hasFacebookPixel, trackingTools,
    canProvideAnalyticsAccess, analyticsNotes
  },
  socialMedia: {
    socialPlatforms, hasFbBusinessManager, hasGoogleAds
  },
  goals: {
    primaryGoal, successDefinition, keyMetrics,
    revenueTarget, targetCpa, targetRoas
  },
  audience: {
    idealCustomerProfile, geographicTargeting, ageRange,
    genderTargeting, competitors, competitorStrengths
  },
  budget: {
    monthlyBudgetRange, hasCreativeAssets, hasMarketingContact,
    marketingContactName, marketingContactEmail
  }
}
```

---

## 🔧 Setting Up Your N8N Workflow

### Step 1: Verify Webhook is Active

1. Open your N8N workflow
2. Find the Webhook node with path: `/webhook-test/5413e2e7-0c36-43d5-b711-6e4eaf619812`
3. Click "Listen for Test Event"
4. The webhook is now waiting for data

### Step 2: Test the Integration

**Option A: Use the Sample Payload**

You can test your N8N webhook manually:

```bash
curl -X POST https://n8n.eventplanners.cloud/webhook-test/5413e2e7-0c36-43d5-b711-6e4eaf619812 \
  -H "Content-Type: application/json" \
  -d @SAMPLE_N8N_PAYLOAD.json
```

**Option B: Complete Onboarding Form**

1. Start your Next.js app: `npm run dev`
2. Go to http://localhost:3000
3. Click "Start Onboarding"
4. Fill out all 7 steps
5. Submit the form
6. Check your N8N workflow - it should receive the data

### Step 3: Process the Data in N8N

Here's a basic workflow structure:

```
Webhook (Receive Data)
   ↓
Set Variables (Extract useful fields)
   ↓
Function Node (Format data for your use case)
   ↓
[Your custom nodes - create docs, send emails, etc.]
```

**Example: Extract Key Variables**

Add a "Set" node after the webhook:

```javascript
// Extract commonly used fields
{
  clientId: "{{ $json.clientId }}",
  uniqueClientId: "{{ $json.uniqueClientId }}",
  companyName: "{{ $json.companyName }}",
  email: "{{ $json.email }}",
  industry: "{{ $json.industry }}",
  primaryGoal: "{{ $json.onboardingData.goals.primaryGoal }}",
  budget: "{{ $json.onboardingData.budget.monthlyBudgetRange }}"
}
```

---

## 📤 Sending Links Back to the App

After your N8N workflow generates resources (Google Docs, ClickUp, Airtable, etc.), you need to send them back to the app.

### Step 1: Format the Response

Add a "Function" or "Code" node at the end of your workflow:

```javascript
// Get the client IDs from the webhook data
const clientId = items[0].json.clientId;
const uniqueClientId = items[0].json.uniqueClientId;

// Get the generated URLs from your previous nodes
// (Adjust these based on your actual node names)
const googleDocUrl = $('Google Docs').first().json.documentUrl;
const clickupUrl = $('ClickUp').first().json.url;
const airtableUrl = $('Airtable').first().json.recordUrl;

return {
  json: {
    uniqueClientId: uniqueClientId,
    clientId: clientId,
    secret: "dev-secret-change-in-production", // Must match N8N_CALLBACK_SECRET
    links: [
      {
        type: "google_doc",
        title: "Marketing Strategy Document",
        url: googleDocUrl,
        description: "Your personalized marketing strategy",
        icon: "FileText"
      },
      {
        type: "clickup",
        title: "Project Board",
        url: clickupUrl,
        description: "Task management and tracking",
        icon: "Layout"
      },
      {
        type: "airtable",
        title: "Client Database",
        url: airtableUrl,
        description: "Centralized data repository",
        icon: "Database"
      }
    ]
  }
};
```

### Step 2: Send HTTP Request to App

Add an "HTTP Request" node:

**For Local Development:**
- **Method**: POST
- **URL**: `http://localhost:3000/api/webhooks/n8n/callback`
- **Authentication**: None
- **Body**: JSON (from previous node)
- **Headers**: `Content-Type: application/json`

**For Production (Railway):**
- **URL**: `https://your-app.up.railway.app/api/webhooks/n8n/callback`
- Everything else stays the same

### Step 3: Verify Response

The app will respond with:

```json
{
  "success": true,
  "message": "Links saved successfully",
  "linksCreated": 3,
  "clientId": "uuid"
}
```

---

## 🔒 Security: Callback Secret

The `secret` field in the callback payload authenticates N8N requests.

**Current secret:** `dev-secret-change-in-production`

**For Production:**
1. Generate a secure secret:
```bash
openssl rand -base64 32
```

2. Update `.env`:
```env
N8N_CALLBACK_SECRET="your-new-secure-secret"
```

3. Update your N8N workflow to use the same secret

---

## 🧪 Testing End-to-End

### Test Flow:

1. **Client completes onboarding** (http://localhost:3000)
   ↓
2. **Data sent to N8N webhook** (your URL above)
   ↓
3. **N8N processes data** (creates docs, tasks, etc.)
   ↓
4. **N8N sends links back to app** (`POST /api/webhooks/n8n/callback`)
   ↓
5. **Client sees links in dashboard** (after logging in)

### Verify Each Step:

✅ **Step 1-2:** Check N8N workflow execution logs
✅ **Step 3:** Check your N8N node outputs
✅ **Step 4:** Check app logs and `n8n_webhook_logs` table
✅ **Step 5:** Login as client and check dashboard

---

## 📊 Debugging

### Check Webhook Logs in Database

```sql
-- See all N8N webhook calls
SELECT * FROM n8n_webhook_logs
ORDER BY created_at DESC
LIMIT 10;

-- See failed webhooks
SELECT * FROM n8n_webhook_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Common Issues

**❌ Webhook not triggering**
- Verify webhook is "Waiting for webhook call" in N8N
- Check the URL is exactly: `https://n8n.eventplanners.cloud/webhook-test/5413e2e7-0c36-43d5-b711-6e4eaf619812`
- Check app is running (`npm run dev`)

**❌ Callback fails (Invalid secret)**
- Verify `secret` in N8N matches `N8N_CALLBACK_SECRET` in `.env`
- Check you're using the correct URL (localhost vs Railway)

**❌ Links not showing in dashboard**
- Verify callback returned 200 OK
- Check `client_links` table for created links
- Ensure client is logged in with correct account

---

## 🚀 Quick Start Checklist

- [x] N8N webhook URL configured in `.env`
- [ ] Set up Railway PostgreSQL database
- [ ] Run database migrations (`npx prisma migrate dev --name init`)
- [ ] Create admin user
- [ ] Start dev server (`npm run dev`)
- [ ] Test onboarding flow
- [ ] Set up N8N workflow to process data
- [ ] Configure N8N callback to send links back
- [ ] Test end-to-end flow

---

## 📞 Need Help?

- Full integration guide: `N8N_INTEGRATION.md`
- Setup instructions: `GETTING_STARTED.md`
- API documentation: `README.md`

---

**Your N8N integration is ready to go! 🎉**
