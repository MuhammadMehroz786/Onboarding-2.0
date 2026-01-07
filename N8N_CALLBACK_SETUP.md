# N8N Callback Setup - Send Links Back to App

This guide shows you **exactly** how to configure N8N to send generated links back to your app after processing client data.

---

## 🎯 What is the Callback?

After your N8N workflow receives client onboarding data and generates resources (Google Docs, ClickUp tasks, Airtable records, etc.), it needs to **send those links back** to your app so the client can see them in their dashboard.

**Flow:**
```
Client Submits Form → App → N8N Webhook
                               ↓
                    [N8N processes data]
                    [Creates docs/tasks]
                               ↓
                    N8N → App Callback → Client Dashboard
```

---

## 🔧 Step-by-Step Setup in N8N

### Step 1: Add a Function/Code Node

After your workflow generates resources, add a **"Code"** node (or "Function" node in older N8N versions).

**Node Configuration:**
- **Name:** "Format Callback Payload"
- **Language:** JavaScript

**Code:**

```javascript
// Get client IDs from the webhook data (first node)
const webhookData = $('Webhook').first().json;
const clientId = webhookData.clientId;
const uniqueClientId = webhookData.uniqueClientId;

// Example: Get URLs from your document generation nodes
// Adjust these based on your actual node names
const googleDocUrl = $('Google Docs').first().json.documentUrl || "https://docs.google.com/document/d/example";
const clickupTaskUrl = $('ClickUp').first().json.url || "https://app.clickup.com/t/example";

// Format the payload to send back to the app
return {
  uniqueClientId: uniqueClientId,
  clientId: clientId,
  secret: "dev-secret-change-in-production", // Must match your app's N8N_CALLBACK_SECRET
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
      title: "Project Management Board",
      url: clickupTaskUrl,
      description: "Track tasks, deadlines, and progress",
      icon: "Layout"
    },
    {
      type: "airtable",
      title: "Client Database",
      url: "https://airtable.com/app123/tbl456/viw789",
      description: "Centralized client data and analytics",
      icon: "Database"
    }
  ]
};
```

**Important Notes:**
- Replace `$('Google Docs').first().json.documentUrl` with the actual path to your generated document URL
- The `secret` must match `N8N_CALLBACK_SECRET` in your app's `.env` file
- Supported link types: `google_doc`, `clickup`, `airtable`, `looker`, `other`
- Supported icons: `FileText`, `Layout`, `Database`, `BarChart`, `Link`, `ExternalLink`

---

### Step 2: Add HTTP Request Node

Add an **"HTTP Request"** node after the Function node.

**Node Configuration:**

| Setting | Value |
|---------|-------|
| **Method** | POST |
| **URL** | See below ↓ |
| **Authentication** | None |
| **Send Body** | Yes |
| **Body Content Type** | JSON |
| **Specify Body** | Using JSON |
| **JSON/RAW Parameters** | Leave empty (use output from previous node) |

**URL Options:**

**For Local Development (Testing):**
```
http://localhost:3000/api/webhooks/n8n/callback
```

**For Production (Railway):**
```
https://your-app-name.up.railway.app/api/webhooks/n8n/callback
```

**For Testing Before Railway:**
You can use a tunnel service like ngrok:
```bash
# In your terminal, run:
ngrok http 3000

# Then use the URL ngrok gives you:
https://abc123.ngrok.io/api/webhooks/n8n/callback
```

**Headers to Add:**
```
Content-Type: application/json
```

---

### Step 3: Test the Callback

#### Option A: Test with Mock Data (No Real Resources)

Add this to your Function/Code node for testing:

```javascript
// TEST VERSION - Returns hardcoded URLs for testing
const webhookData = $('Webhook').first().json;

return {
  uniqueClientId: webhookData.uniqueClientId || "CL-TEST123",
  clientId: webhookData.clientId || "550e8400-e29b-41d4-a716-446655440000",
  secret: "dev-secret-change-in-production",
  links: [
    {
      type: "google_doc",
      title: "Marketing Strategy Document [TEST]",
      url: "https://docs.google.com/document/d/1234567890abcdefghijk/edit",
      description: "This is a test document link",
      icon: "FileText"
    },
    {
      type: "clickup",
      title: "Project Board [TEST]",
      url: "https://app.clickup.com/t/12345678",
      description: "This is a test ClickUp link",
      icon: "Layout"
    }
  ]
};
```

Then execute your workflow and check if the HTTP Request returns `200 OK`.

---

## 🧪 Testing the Complete Flow

### Prerequisites:
1. Your Next.js app is running (`npm run dev`)
2. Railway database is set up with migrations run
3. You have a test client in the database

### Test Method 1: Using N8N Workflow

1. **In N8N:**
   - Make sure your webhook is listening
   - Execute the workflow with test data

2. **Check HTTP Request Node Output:**
   You should see:
   ```json
   {
     "success": true,
     "message": "Links saved successfully",
     "linksCreated": 2,
     "clientId": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```

3. **Verify in App:**
   - Login as the test client
   - Go to dashboard
   - You should see the links appear!

### Test Method 2: Using cURL (Manual Test)

Test the callback endpoint directly:

```bash
curl -X POST http://localhost:3000/api/webhooks/n8n/callback \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueClientId": "CL-TEST123-ABC",
    "clientId": "550e8400-e29b-41d4-a716-446655440000",
    "secret": "dev-secret-change-in-production",
    "links": [
      {
        "type": "google_doc",
        "title": "Test Marketing Strategy",
        "url": "https://docs.google.com/document/d/test123/edit",
        "description": "Test document",
        "icon": "FileText"
      },
      {
        "type": "clickup",
        "title": "Test Project Board",
        "url": "https://app.clickup.com/t/test456",
        "description": "Test ClickUp board",
        "icon": "Layout"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Links saved successfully",
  "linksCreated": 2,
  "clientId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 🔍 Troubleshooting

### ❌ Error: "Invalid secret key"

**Problem:** The secret in N8N doesn't match your app's `.env`

**Solution:**
1. Check `.env` file:
   ```env
   N8N_CALLBACK_SECRET="dev-secret-change-in-production"
   ```
2. Update your N8N Function node to use the **exact same secret**
3. Restart your Next.js app (`npm run dev`)

---

### ❌ Error: "Client not found"

**Problem:** The `clientId` or `uniqueClientId` doesn't exist in your database

**Solution:**
1. Check your database:
   ```sql
   SELECT id, unique_client_id, company_name FROM clients;
   ```
2. Use a valid `clientId` from the database
3. Or complete a full onboarding first to create a test client

---

### ❌ Error: "ECONNREFUSED" or "Cannot connect"

**Problem:** N8N can't reach your app (usually happens with localhost)

**Solutions:**

**Option 1: Use ngrok (Recommended for local testing)**
```bash
# Install ngrok: https://ngrok.com/download
# Then run:
ngrok http 3000

# Use the HTTPS URL ngrok provides in your N8N HTTP Request node
```

**Option 2: Use Railway URL (Production)**
- Deploy your app to Railway
- Use the Railway URL: `https://your-app.up.railway.app/api/webhooks/n8n/callback`

**Option 3: Make N8N accessible to localhost (Advanced)**
- Check if N8N and your app are on the same network
- Use Docker network if both are in containers

---

### ❌ HTTP Request Returns 500

**Problem:** App error when processing the callback

**Check:**
1. **App logs** - Look for error messages in terminal
2. **Database connection** - Is PostgreSQL running?
3. **Database logs table:**
   ```sql
   SELECT * FROM n8n_webhook_logs
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
4. **Payload format** - Ensure all required fields are present

---

## 📋 Complete N8N Workflow Example

Here's a minimal workflow structure:

```
1. Webhook (Receive client data)
     ↓
2. Code Node: Extract Variables
     ↓
3. Google Docs: Create Strategy Document
     ↓
4. ClickUp: Create Project Task
     ↓
5. Code Node: Format Callback Payload
     ↓
6. HTTP Request: Send to App
```

### Workflow JSON (Import This):

```json
{
  "name": "Client Onboarding Automation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "5413e2e7-0c36-43d5-b711-6e4eaf619812",
        "responseMode": "onReceived"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "const webhookData = $input.first().json;\n\nreturn {\n  uniqueClientId: webhookData.uniqueClientId,\n  clientId: webhookData.clientId,\n  secret: \"dev-secret-change-in-production\",\n  links: [\n    {\n      type: \"google_doc\",\n      title: \"Marketing Strategy [Generated]\",\n      url: \"https://docs.google.com/document/d/example123/edit\",\n      description: \"Your personalized strategy\",\n      icon: \"FileText\"\n    }\n  ]\n};"
      },
      "name": "Format Callback",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/webhooks/n8n/callback",
        "sendBody": true,
        "contentType": "json"
      },
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Format Callback", "type": "main", "index": 0}]]
    },
    "Format Callback": {
      "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
    }
  }
}
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Function node formats payload correctly
- [ ] HTTP Request node URL is correct
- [ ] Secret matches `.env` file
- [ ] Test execution returns 200 OK
- [ ] Response contains `"success": true`
- [ ] Links appear in database (`SELECT * FROM client_links`)
- [ ] Links visible in client dashboard
- [ ] Client status updated to "active"

---

## 🚀 Production Checklist

Before going live:

- [ ] Change secret from `dev-secret-change-in-production` to a secure random string
- [ ] Update URL to Railway production URL
- [ ] Test with real client data
- [ ] Set up error monitoring in N8N
- [ ] Configure retry logic if HTTP Request fails
- [ ] Add logging/notifications for failed callbacks

---

## 📞 Need Help?

**Common Questions:**

**Q: Can I send links multiple times for the same client?**
A: Yes! Each callback adds new links. The app won't duplicate them.

**Q: What if document generation takes 5+ minutes?**
A: You can:
1. Send an immediate callback with placeholder links
2. Send a second callback later with real links
3. Use a separate workflow that polls for completion

**Q: Can I update existing links?**
A: Currently, no. You can only add new links. To update, delete from database manually.

---

**Your N8N callback is ready to configure! 🎉**

Follow the steps above and your clients will see their generated resources in their dashboard automatically.
