# Complete Integration Flow

Visual guide showing how everything works together.

---

## 🔄 End-to-End Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT JOURNEY                           │
└─────────────────────────────────────────────────────────────────┘

1. CLIENT VISITS SITE
   └─> http://localhost:3000
       └─> Clicks "Start Onboarding"

2. COMPLETES 7-STEP WIZARD
   ├─> Step 1: Business Info
   ├─> Step 2: Marketing State
   ├─> Step 3: Analytics
   ├─> Step 4: Social Media
   ├─> Step 5: Goals
   ├─> Step 6: Audience
   └─> Step 7: Budget & Account Creation

3. SUBMITS FORM
   └─> POST /api/onboarding/submit
       ├─> ✅ User created in database
       ├─> ✅ Client profile created
       └─> ✅ Unique ID generated: CL-ABC123

┌─────────────────────────────────────────────────────────────────┐
│                      AUTOMATION TRIGGERS                         │
└─────────────────────────────────────────────────────────────────┘

4. APP SENDS DATA TO N8N
   └─> POST https://n8n.eventplanners.cloud/webhook-test/5413e2e7...
       └─> Payload includes:
           ├─> uniqueClientId
           ├─> clientId
           ├─> All 7 steps of onboarding data
           └─> Client contact info

5. N8N PROCESSES DATA
   └─> Your N8N Workflow:
       ├─> Webhook receives data ✅ (WORKING!)
       ├─> Extract variables
       ├─> Create Google Doc (Strategy)
       ├─> Create ClickUp Task (Project Board)
       ├─> Create Airtable Record (Database)
       └─> Format callback payload

6. N8N SENDS LINKS BACK
   └─> POST http://localhost:3000/api/webhooks/n8n/callback
       └─> Payload:
           {
             "uniqueClientId": "CL-ABC123",
             "clientId": "uuid",
             "secret": "dev-secret...",
             "links": [
               { "type": "google_doc", "url": "...", ... },
               { "type": "clickup", "url": "...", ... },
               { "type": "airtable", "url": "...", ... }
             ]
           }

7. APP STORES LINKS
   └─> Links saved to database (client_links table)
   └─> Client status updated to "active"
   └─> Activity logged

┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT SEES RESULTS                         │
└─────────────────────────────────────────────────────────────────┘

8. CLIENT LOGS IN
   └─> POST /api/auth/signin
       └─> NextAuth validates credentials

9. CLIENT DASHBOARD LOADS
   └─> GET /api/client/dashboard
       └─> Returns:
           ├─> Client info
           ├─> All generated links
           └─> Stats (link counts, etc.)

10. CLIENT SEES THEIR RESOURCES
    ├─> 📄 Documents Section
    │   └─> Marketing Strategy Document [View]
    ├─> 📋 Projects Section
    │   └─> Project Management Board [Open]
    └─> 🗄️ Data Section
        └─> Client Database [Access]
```

---

## 📊 Database Flow

```
┌──────────────┐
│    users     │
│              │
│ - id         │
│ - email      │◄───┐
│ - password   │    │
│ - role       │    │
└──────────────┘    │
                    │ One-to-One
┌──────────────┐    │
│   clients    │────┘
│              │
│ - user_id    │────┐
│ - unique_id  │    │
│ - company    │    │
│ - industry   │    │ One-to-Many
│ - ...all     │    │
│   onboarding │    │
│   data       │    │
└──────────────┘    │
                    │
┌──────────────┐    │
│client_links  │◄───┘
│              │
│ - client_id  │
│ - type       │
│ - title      │
│ - url        │
│ - icon       │
└──────────────┘
```

---

## 🔌 N8N Workflow Structure

```
┌────────────────────────────────────────────────────────────┐
│                    YOUR N8N WORKFLOW                        │
└────────────────────────────────────────────────────────────┘

[1] Webhook Node
    Method: POST
    Path: /webhook-test/5413e2e7-0c36-43d5-b711-6e4eaf619812
    Status: ✅ RECEIVING DATA
         ↓
         ↓ Outputs: Full client onboarding data
         ↓
[2] Code Node: "Extract Variables"
    Extract: companyName, industry, goals, budget, etc.
         ↓
         ├──────┬──────┬──────┐
         ↓      ↓      ↓      ↓

    [3a] Google     [3b] ClickUp    [3c] Airtable
         Docs Node       Node            Node
         Create doc      Create task     Create record
         ↓               ↓               ↓
         └───────┬───────┴───────┬───────┘
                 ↓               ↓

[4] Code Node: "Format Callback"
    Create payload with all generated URLs
         ↓
         ↓ Outputs: { clientId, secret, links: [...] }
         ↓
[5] HTTP Request Node
    Method: POST
    URL: http://localhost:3000/api/webhooks/n8n/callback
    Status: ⏳ READY TO CONFIGURE
         ↓
         ↓ Response: { "success": true, "linksCreated": 3 }
         ↓
    ✅ DONE!
```

---

## 🎯 Configuration Checklist

### ✅ Already Done:
- [x] Next.js project created
- [x] Database schema designed
- [x] API endpoints built
- [x] Authentication configured
- [x] N8N webhook URL configured
- [x] Outbound webhook tested ✅

### ⏳ To Do Now:
- [ ] **Set up Railway PostgreSQL** (5 min)
- [ ] **Run database migrations** (2 min)
- [ ] **Create admin user** (2 min)
- [ ] **Add Code node to N8N** (format callback)
- [ ] **Add HTTP Request node to N8N** (send to app)
- [ ] **Test callback** (use test-callback.sh)
- [ ] **Complete full end-to-end test**

---

## 🧪 Testing Commands

### Test 1: N8N Outbound (App → N8N)
```bash
# Already tested and working! ✅
curl -X POST https://n8n.eventplanners.cloud/webhook-test/5413e2e7... \
  -H "Content-Type: application/json" \
  -d @SAMPLE_N8N_PAYLOAD.json
```

### Test 2: N8N Inbound (N8N → App)
```bash
# Test the callback endpoint
./test-callback.sh

# Or manually:
curl -X POST http://localhost:3000/api/webhooks/n8n/callback \
  -H "Content-Type: application/json" \
  -d '{ "uniqueClientId": "...", "clientId": "...", "secret": "...", "links": [...] }'
```

### Test 3: Full End-to-End
```bash
1. npm run dev                    # Start app
2. Open http://localhost:3000     # Visit site
3. Complete onboarding            # Fill form
4. Check N8N workflow             # See execution
5. Check callback in app logs     # Verify links saved
6. Login as client                # See dashboard
```

---

## 📁 Important Files Reference

| File | Purpose |
|------|---------|
| `N8N_CALLBACK_SETUP.md` | **← START HERE** Detailed callback guide |
| `YOUR_N8N_SETUP.md` | Your specific webhook configuration |
| `N8N_INTEGRATION.md` | Complete integration documentation |
| `GETTING_STARTED.md` | App setup instructions |
| `test-callback.sh` | Quick callback test script |
| `SAMPLE_N8N_PAYLOAD.json` | Example payload format |

---

## 🚀 Quick Start (Right Now)

Want to test the callback immediately?

1. **Make sure you have Railway set up** (or skip to step 3 for mock test)

2. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Start your app:**
   ```bash
   npm run dev
   ```

4. **Run the test:**
   ```bash
   ./test-callback.sh
   ```

5. **Expected output:**
   ```
   {"success":true,"message":"Links saved successfully","linksCreated":3}
   📊 HTTP Status: 200
   ```

---

**You're almost there! Just add those 2 nodes to your N8N workflow and you're done! 🎉**
