#!/bin/bash

# Test N8N Callback Endpoint
# This simulates N8N sending links back to your app

echo "🧪 Testing N8N Callback Endpoint..."
echo ""

# Make sure your app is running first!
# Run: npm run dev

curl -X POST http://localhost:3000/api/webhooks/n8n/callback \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueClientId": "CL-TEST-CALLBACK",
    "clientId": "test-client-uuid-123",
    "secret": "dev-secret-change-in-production",
    "links": [
      {
        "type": "google_doc",
        "title": "Test Marketing Strategy Document",
        "url": "https://docs.google.com/document/d/1234567890/edit",
        "description": "Your personalized marketing strategy",
        "icon": "FileText"
      },
      {
        "type": "clickup",
        "title": "Test Project Board",
        "url": "https://app.clickup.com/t/abc123",
        "description": "Task management and project tracking",
        "icon": "Layout"
      },
      {
        "type": "airtable",
        "title": "Test Client Database",
        "url": "https://airtable.com/appXXX/tblYYY",
        "description": "Centralized data repository",
        "icon": "Database"
      }
    ]
  }' \
  -w "\n\n📊 HTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ If you see 'success: true', the callback is working!"
echo "❌ If you see an error, check:"
echo "   - Is your app running? (npm run dev)"
echo "   - Is the database connected?"
echo "   - Does the client exist in the database?"
