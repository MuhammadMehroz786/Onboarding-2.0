# N8N Integration Guide

Complete guide for integrating your N8N workflows with the Onboarding Automation Platform.

## Overview

The platform has two-way communication with N8N:

1. **Outbound**: App → N8N (when client completes onboarding)
2. **Inbound**: N8N → App (when links are generated)

---

## Part 1: Receiving Data from the App (Outbound)

### Step 1: Create Webhook in N8N

1. Open your N8N instance
2. Create a new workflow named "Client Onboarding Automation"
3. Add a **Webhook** node
4. Configure it:
   - **Method**: POST
   - **Path**: `onboarding` (or whatever you prefer)
   - **Response Mode**: Immediately
   - **Response Code**: 200

5. Copy the webhook URL (e.g., `https://your-n8n.app.n8n.cloud/webhook/onboarding`)
6. Add it to your app's `.env`:
```env
N8N_ONBOARDING_WEBHOOK_URL="https://your-n8n.app.n8n.cloud/webhook/onboarding"
```

### Step 2: Understand the Payload

When a client completes onboarding, your app sends this data structure:

```json
{
  "uniqueClientId": "CL-KZ1HTJQ2-F3K7OVZ",
  "clientId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@acmecorp.com",
  "companyName": "Acme Corp",
  "industry": "SaaS",
  "websiteUrl": "https://acme.com",
  "onboardingData": {
    "businessInfo": {
      "companyName": "Acme Corp",
      "industry": "SaaS",
      "websiteUrl": "https://acme.com",
      "companyDescription": "B2B SaaS platform for project management",
      "employeeCount": "11-50",
      "businessModel": "B2B"
    },
    "marketingState": {
      "workedWithAgency": true,
      "currentChannels": ["Paid Search", "LinkedIn Ads", "Content Marketing"],
      "marketingFeedback": "Previous agency didn't deliver on lead quality promises",
      "primaryChallenges": ["High CAC", "Low Lead Quality", "Can't track ROI"]
    },
    "analytics": {
      "hasGoogleAnalytics": "Yes",
      "hasFacebookPixel": "Yes",
      "trackingTools": ["GA4", "Google Tag Manager", "HubSpot"],
      "canProvideAnalyticsAccess": "Yes",
      "analyticsNotes": "GA4 setup is incomplete, need help with conversion tracking"
    },
    "socialMedia": {
      "socialPlatforms": {
        "LinkedIn": {
          "handle": "@acmecorp",
          "canProvideAccess": "Yes"
        },
        "Twitter": {
          "handle": "@acme",
          "canProvideAccess": "Yes"
        }
      },
      "hasFbBusinessManager": "Yes",
      "hasGoogleAds": "Yes"
    },
    "goals": {
      "primaryGoal": "Generate 100 qualified leads per month within 90 days",
      "successDefinition": "20% increase in demo bookings, CAC under $150",
      "keyMetrics": ["Lead volume", "Cost per lead", "Revenue"],
      "revenueTarget": "$2M ARR",
      "targetCpa": "$150",
      "targetRoas": "4"
    },
    "audience": {
      "idealCustomerProfile": "CTOs and VP of Engineering at 50-200 employee tech companies, struggling with legacy PM tools",
      "geographicTargeting": "North America",
      "ageRange": "30-50",
      "genderTargeting": "All",
      "competitors": ["https://asana.com", "https://monday.com", "https://clickup.com"],
      "competitorStrengths": "Asana has strong brand recognition, Monday has great UI"
    },
    "budget": {
      "monthlyBudgetRange": "$5,000 - $10,000",
      "hasCreativeAssets": true,
      "hasMarketingContact": true,
      "marketingContactName": "Sarah Johnson",
      "marketingContactEmail": "sarah@acme.com"
    }
  }
}
```

### Step 3: Process the Data in N8N

Here's an example workflow structure:

```
Webhook (Receive Data)
   ↓
Set Variables (Extract key data)
   ↓
[BRANCH 1] Create Google Doc (Marketing Strategy)
   ↓
[BRANCH 2] Create ClickUp Project
   ↓
[BRANCH 3] Create Airtable Record
   ↓
Merge Branches
   ↓
HTTP Request (Send links back to app)
```

#### Example: Set Variables Node

```javascript
// Extract common variables for use in other nodes
return {
  clientId: items[0].json.clientId,
  uniqueClientId: items[0].json.uniqueClientId,
  companyName: items[0].json.companyName,
  email: items[0].json.email,
  industry: items[0].json.industry,
  primaryGoal: items[0].json.onboardingData.goals.primaryGoal,
  budget: items[0].json.onboardingData.budget.monthlyBudgetRange,
  icp: items[0].json.onboardingData.audience.idealCustomerProfile
};
```

#### Example: Create Google Doc Node

Use the **Google Docs** node to create a marketing strategy doc:

1. **Operation**: Create a document
2. **Title**: `Marketing Strategy - {{ $json.companyName }}`
3. **Content**: Use template with variables:

```
# Marketing Strategy for {{ $json.companyName }}

## Company Overview
Industry: {{ $json.industry }}
Website: {{ $json.websiteUrl }}

## Primary Goal
{{ $json.onboardingData.goals.primaryGoal }}

## Target Audience
{{ $json.onboardingData.audience.idealCustomerProfile }}

## Budget
{{ $json.onboardingData.budget.monthlyBudgetRange }}/month

## Recommended Strategy
[Your agency's strategic recommendations based on their answers]
```

#### Example: Create ClickUp Task Node

Use the **ClickUp** node:

1. **Operation**: Create Task
2. **List ID**: Your client onboarding list
3. **Task Name**: `Onboarding - {{ $json.companyName }}`
4. **Description**: Auto-populate with client info
5. **Custom Fields**: Map budget, industry, etc.

#### Example: Create Airtable Record

Use the **Airtable** node:

1. **Operation**: Create
2. **Table**: Clients
3. **Fields**:
   - Company Name: `{{ $json.companyName }}`
   - Email: `{{ $json.email }}`
   - Industry: `{{ $json.industry }}`
   - Budget: `{{ $json.onboardingData.budget.monthlyBudgetRange }}`
   - Onboarding Date: `{{ $now }}`
   - Status: "Active"

---

## Part 2: Sending Links Back to the App (Inbound)

### Step 1: Collect Generated Links

After your N8N workflow creates resources, you need to send the links back to the app.

Add a **Function** node to format the response:

```javascript
const clientId = items[0].json.clientId;
const uniqueClientId = items[0].json.uniqueClientId;

// Get URLs from previous nodes
const googleDocUrl = $('Google Docs').first().json.documentUrl;
const clickupUrl = $('ClickUp').first().json.url;
const airtableUrl = $('Airtable').first().json.recordUrl;

return {
  json: {
    uniqueClientId: uniqueClientId,
    clientId: clientId,
    secret: process.env.N8N_CALLBACK_SECRET, // Set this in N8N environment variables
    links: [
      {
        type: "google_doc",
        title: "Marketing Strategy Document",
        url: googleDocUrl,
        description: "Your personalized marketing strategy and action plan",
        icon: "FileText"
      },
      {
        type: "clickup",
        title: "Project Board",
        url: clickupUrl,
        description: "Task management and project tracking",
        icon: "Layout"
      },
      {
        type: "airtable",
        title: "Client Database",
        url: airtableUrl,
        description: "Centralized data and analytics",
        icon: "Database"
      }
    ]
  }
};
```

### Step 2: Send HTTP Request to App

Add an **HTTP Request** node:

**Configuration:**
- **Method**: POST
- **URL**: `https://your-app.up.railway.app/api/webhooks/n8n/callback`
  (Use `http://localhost:3000/api/webhooks/n8n/callback` for local development)
- **Authentication**: None (security handled by secret)
- **Body Content Type**: JSON
- **Body**: Use output from previous Function node
- **Headers**: `Content-Type: application/json`

**Expected Response:**
```json
{
  "success": true,
  "message": "Links saved successfully",
  "linksCreated": 3,
  "clientId": "uuid"
}
```

---

## Part 3: Testing the Integration

### Test Outbound (App → N8N)

1. In N8N, activate your workflow
2. Click "Listen for Test Event" on the Webhook node
3. In your app, complete the onboarding form
4. Submit the form
5. Check N8N - you should see the webhook trigger
6. Verify all data is received correctly

### Test Inbound (N8N → App)

1. **Option A: Use N8N Test**
   - In your workflow, manually execute with sample data
   - Watch the HTTP Request node
   - Check for 200 OK response

2. **Option B: Use Postman/cURL**
```bash
curl -X POST http://localhost:3000/api/webhooks/n8n/callback \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueClientId": "CL-TEST123",
    "clientId": "YOUR_CLIENT_UUID",
    "secret": "your-n8n-callback-secret",
    "links": [
      {
        "type": "google_doc",
        "title": "Test Document",
        "url": "https://docs.google.com/document/d/test",
        "description": "Test",
        "icon": "FileText"
      }
    ]
  }'
```

3. **Verify in App**
   - Login as the client
   - Check the dashboard
   - Links should appear in their respective sections

---

## Part 4: Link Types Reference

When sending links back to the app, use these `type` values:

| Type | Icon | Description | Example |
|------|------|-------------|---------|
| `google_doc` | FileText | Google Docs, PDFs | Marketing strategy, contracts |
| `clickup` | Layout | ClickUp boards/tasks | Project board, task list |
| `airtable` | Database | Airtable bases | Client database, analytics |
| `looker` | BarChart | Looker Studio dashboards | Analytics dashboard |
| `other` | Link | Any other link | Custom tools |

**Icon Options**: `FileText`, `Layout`, `Database`, `BarChart`, `Link`, `ExternalLink`

---

## Part 5: Error Handling

### Check Webhook Logs

Query the database to see webhook status:

```sql
SELECT * FROM n8n_webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Common Errors

**❌ Error: "Invalid secret key"**
- Check `N8N_CALLBACK_SECRET` in app matches secret sent from N8N
- Make sure secret is included in payload

**❌ Error: "Client not found"**
- Verify `clientId` or `uniqueClientId` is correct
- Check database for client existence

**❌ Error: "Invalid or missing links array"**
- Ensure `links` is an array
- Each link must have `type`, `title`, and `url`

---

## Part 6: Advanced Use Cases

### Conditional Document Generation

Generate different documents based on industry:

```javascript
// In N8N Function node
const industry = items[0].json.industry;

if (industry === 'SaaS') {
  // Create SaaS-specific strategy doc
  return { createSaaSDoc: true };
} else if (industry === 'E-commerce') {
  // Create E-commerce-specific doc
  return { createEcommerceDoc: true };
}
```

### Delayed Link Generation

If document generation takes time:

1. Initially, send client status as "Processing"
2. Generate documents asynchronously
3. Send webhook callback when complete
4. Client sees loading state, then links appear

### Multiple Callback Calls

You can call the webhook multiple times to progressively add links:

**First call** (immediately):
```json
{
  "links": [
    {
      "type": "google_doc",
      "title": "Welcome Guide",
      "url": "..."
    }
  ]
}
```

**Second call** (after processing):
```json
{
  "links": [
    {
      "type": "clickup",
      "title": "Project Board",
      "url": "..."
    }
  ]
}
```

---

## Example N8N Workflow JSON

Here's a basic workflow you can import:

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "onboarding",
        "responseMode": "onReceived",
        "responseCode": 200
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "// Extract and format data\nconst data = items[0].json;\nreturn {\n  clientId: data.clientId,\n  uniqueClientId: data.uniqueClientId,\n  companyName: data.companyName\n};"
      },
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "position": [450, 300]
    }
  ]
}
```

---

## Questions & Support

**Q: Can I update links after they're created?**
A: Yes! Just send another webhook call with the same `clientId` and new link data. The app will add them.

**Q: How do I delete links?**
A: Currently, you need to delete directly from the database. Admin UI for link management is on the roadmap.

**Q: Can I send links without going through N8N?**
A: Yes! You can manually POST to `/api/webhooks/n8n/callback` from any system.

---

**Happy automating! 🤖**
