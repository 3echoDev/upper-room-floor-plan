// Script to check existing Calendly webhook subscriptions
const https = require('https');

const CALENDLY_ACCESS_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzY3OTM1MzAwLCJqdGkiOiI3MjllMTljNi0wMmFhLTRlNDAtODZjMi1lY2FhYmVhYTA0M2YiLCJ1c2VyX3V1aWQiOiI0MWEyNmI2OS0zOTZkLTRmYTMtOGY1NC00NTVjMjBiMWJkMTcifQ.k_WAkpHUg6EvDllhWq_sss5HD3QedljpDPUi7HKQ8NHKYj8JWuzenB-CYr7xn8BbXliQ5jkxbSPws7ifR59iFQ';

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function checkWebhooks() {
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
    console.log(`✅ Organization: ${organizationUri}\n`);
    
    console.log('📋 Step 2: Listing all webhook subscriptions...\n');
    
    // List webhooks for organization
    const webhooksResponse = await makeRequest({
      hostname: 'api.calendly.com',
      path: `/webhook_subscriptions?organization=${encodeURIComponent(organizationUri)}&scope=organization`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const webhooks = webhooksResponse.collection || [];
    
    if (webhooks.length === 0) {
      console.log('❌ NO WEBHOOKS FOUND!');
      console.log('\n⚠️  This is the problem - no webhook subscription exists.');
      console.log('   Calendly cannot send bookings to your server without a webhook.');
      console.log('\n📝 You need to create a webhook subscription.');
      return;
    }
    
    console.log(`✅ Found ${webhooks.length} webhook subscription(s):\n`);
    
    webhooks.forEach((webhook, index) => {
      console.log(`${index + 1}. Webhook Subscription:`);
      console.log(`   URI: ${webhook.uri}`);
      console.log(`   URL: ${webhook.callback_url}`);
      console.log(`   Status: ${webhook.state} ${webhook.state === 'active' ? '✅' : '❌ DISABLED'}`);
      console.log(`   Events: ${webhook.events.join(', ')}`);
      console.log(`   Created: ${webhook.created_at}`);
      console.log(`   Updated: ${webhook.updated_at}`);
      
      if (webhook.state === 'disabled') {
        console.log(`   ⚠️  WARNING: This webhook is DISABLED!`);
        console.log(`      Calendly disabled it due to delivery failures.`);
        console.log(`      You need to delete and recreate it.`);
      }
      
      console.log('');
    });
    
    // Check if any webhook points to your Vercel URL
    const expectedUrl = 'https://upper-room-calendly-server-6ydwlf9hp-3echos-projects.vercel.app/api/webhook/calendly';
    const matchingWebhook = webhooks.find(w => w.callback_url === expectedUrl);
    
    if (matchingWebhook) {
      if (matchingWebhook.state === 'active') {
        console.log('✅ Found active webhook pointing to your Vercel server!');
        console.log('   If bookings still don\'t work, check Vercel logs for errors.');
      } else {
        console.log('❌ Found webhook pointing to your server, but it\'s DISABLED!');
        console.log('   You need to delete and recreate it.');
      }
    } else {
      console.log('❌ No webhook found pointing to your Vercel server!');
      console.log(`   Expected URL: ${expectedUrl}`);
      console.log('   You need to create a webhook subscription with this URL.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('401')) {
      console.error('   Your Calendly access token might be invalid or expired.');
    }
  }
}

checkWebhooks();

