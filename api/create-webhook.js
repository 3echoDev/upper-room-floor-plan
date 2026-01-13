// Script to create Calendly webhook subscription
const https = require('https');

const CALENDLY_ACCESS_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY3OTM1MzAwLCJqdGkiOiI3MjllMTljNi0wMmFhLTRlNDAtODZjMi1lY2FhYmVhYTA0M2YiLCJ1c2VyX3V1aWQiOiI0MWEyNmI2OS0zOTZkLTRmYTMtOGY1NC00NTVjMjBiMWJkMTcifQ.k_WAkpHUg6EvDllhWq_sss5HD3QedljpDPUi7HKQ8NHKYj8JWuzenB-CYr7xn8BbXliQ5jkxbSPws7ifR59iFQ';

// IMPORTANT: Use your current Vercel deployment URL
const WEBHOOK_URL = 'https://upper-room-calendly-server-9wmnlgx97-3echos-projects.vercel.app/api/webhook/calendly';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 204 || (res.statusCode >= 200 && res.statusCode < 300 && body === '')) {
            resolve({ success: true, statusCode: res.statusCode });
          } else {
            const parsed = body ? JSON.parse(body) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
            }
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body || 'Empty response'}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createWebhook() {
  try {
    console.log('🔍 Step 1: Getting user and organization...\n');
    
    // Get user info
    const userResponse = await makeRequest({
      hostname: 'api.calendly.com',
      path: '/users/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const organizationUri = userResponse.resource.current_organization;
    if (!organizationUri) {
      throw new Error('No organization found. You may need to upgrade your Calendly account.');
    }
    
    console.log(`✅ Organization: ${organizationUri}\n`);
    
    console.log('🔗 Step 2: Creating webhook subscription...\n');
    console.log(`   Webhook URL: ${WEBHOOK_URL}\n`);
    
    // Create webhook subscription
    const webhookData = {
      url: WEBHOOK_URL,
      events: ['invitee.created', 'invitee.canceled'],
      organization: organizationUri,
      scope: 'organization'
    };
    
    const webhookResponse = await makeRequest({
      hostname: 'api.calendly.com',
      path: '/webhook_subscriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, webhookData);
    
    console.log('✅ Webhook subscription created successfully!');
    console.log(`   Subscription URI: ${webhookResponse.resource.uri}`);
    console.log(`   Status: ${webhookResponse.resource.state}`);
    console.log(`   Events: ${webhookResponse.resource.events.join(', ')}`);
    console.log(`   Callback URL: ${webhookResponse.resource.callback_url}`);
    console.log('\n🎉 Setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make a test booking on Calendly');
    console.log('   2. Check Vercel logs for webhook requests');
    console.log('   3. Check Airtable for the new reservation');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('401')) {
      console.error('\n   Your Calendly access token might be invalid or expired.');
      console.error('   Please get a new token from: https://calendly.com/integrations/api_webhooks');
    } else if (error.message.includes('400')) {
      console.error('\n   There might be an issue with the webhook URL or organization.');
      console.error('   Check that the URL is publicly accessible and returns 200 for POST requests.');
    }
    process.exit(1);
  }
}

createWebhook();

