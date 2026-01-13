// Script to test the webhook endpoint with a mock Calendly payload
const https = require('https');

const WEBHOOK_URL = 'https://upper-room-calendly-server-5qy349sza-3echos-projects.vercel.app/api/webhook/calendly';

// Mock Calendly webhook payload (similar to what Calendly sends)
const mockPayload = {
  event: 'invitee.created',
  payload: {
    name: 'Test Customer',
    email: 'test@example.com',
    scheduled_event: {
      uri: 'https://api.calendly.com/scheduled_events/TEST123',
      start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      end_time: new Date(Date.now() + 4500000).toISOString(), // 1.5 hours from now
      event_type: 'https://api.calendly.com/event_types/TEST456'
    },
    questions_and_answers: [
      {
        question: 'Number of guests',
        answer: '4'
      }
    ],
    text_reminder_number: '+6591234567',
    uri: 'https://api.calendly.com/scheduled_events/TEST123/invitees/TEST789'
  }
};

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : { rawBody: body };
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: { rawBody: body, parseError: e.message }
          });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function testWebhook() {
  console.log('🧪 Testing webhook endpoint...\n');
  console.log(`URL: ${WEBHOOK_URL}\n`);
  
  try {
    console.log('📤 Sending mock Calendly webhook payload...');
    const response = await makeRequest(WEBHOOK_URL, mockPayload);
    
    console.log(`\n📥 Response Status: ${response.statusCode}`);
    console.log('Response Body:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('\n✅ Webhook endpoint responded successfully!');
      console.log('   This means the endpoint code exists and is working.');
    } else if (response.statusCode === 500) {
      console.log('\n❌ Webhook endpoint returned 500 (Server Error)');
      console.log('   Check Vercel logs for the actual error.');
      console.log('   The endpoint code exists but has a bug.');
    } else {
      console.log(`\n⚠️  Unexpected status code: ${response.statusCode}`);
      console.log('   Response:', response.body);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing webhook:', error.message);
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('   The endpoint URL might be wrong or not accessible.');
    }
  }
}

testWebhook();

