// Comprehensive test script to check if the Vercel server is working
// Run: node test-server.js

const https = require('https');

const SERVER_URL = 'https://upper-room-calendly-server-5qy349sza-3echos-projects.vercel.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.body));
    }

    const req = https.request(requestOptions, (res) => {
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
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, path, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${SERVER_URL}${path}`);
  
  try {
    const response = await makeRequest(`${SERVER_URL}${path}`, options);
    
    const statusIcon = response.statusCode === 200 ? '✅' : 
                       response.statusCode >= 500 ? '❌' : '⚠️';
    
    console.log(`   ${statusIcon} Status: ${response.statusCode}`);
    
    if (response.body.error) {
      console.log(`   ❌ Error: ${response.body.error}`);
    }
    
    if (response.body.status) {
      console.log(`   Status: ${response.body.status}`);
    }
    
    return {
      name,
      path,
      statusCode: response.statusCode,
      success: response.statusCode === 200,
      response: response.body
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      name,
      path,
      statusCode: 0,
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Server Tests...\n');
  console.log(`Server: ${SERVER_URL}\n`);
  
  const results = [];
  
  // Test 1: Health check (if it exists)
  results.push(await testEndpoint('Health Check', '/api/health'));
  
  // Test 2: Test connection endpoint (will test environment variables and Airtable)
  results.push(await testEndpoint('Connection Test', '/api/test-connection'));
  
  // Test 3: Webhook endpoint (should return method not allowed for GET)
  results.push(await testEndpoint('Webhook Endpoint (GET)', '/api/webhook/calendly'));
  
  // Test 4: Logs endpoint (if it exists)
  results.push(await testEndpoint('Logs Endpoint', '/api/logs'));
  
  // Print summary
  console.log('\n\n📊 Test Summary:');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let failCount = 0;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const status = result.statusCode || 'ERROR';
    console.log(`${icon} ${result.name.padEnd(35)} ${status.toString().padStart(4)}`);
    
    if (result.success) successCount++;
    else failCount++;
    
    // Print details for connection test
    if (result.name === 'Connection Test' && result.response) {
      if (result.response.environmentVariables) {
        console.log('\n   Environment Variables:');
        Object.entries(result.response.environmentVariables).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      }
      
      if (result.response.airtableTest) {
        console.log('\n   Airtable Test:');
        console.log(`     Status Code: ${result.response.airtableTest.statusCode}`);
        console.log(`     Success: ${result.response.airtableTest.success ? '✅' : '❌'}`);
        if (result.response.airtableTest.error) {
          console.log(`     Error: ${result.response.airtableTest.error}`);
        }
      }
      
      if (result.response.error) {
        console.log(`\n   ❌ Error: ${result.response.error}`);
      }
    }
  });
  
  console.log('='.repeat(60));
  console.log(`\n✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (results.find(r => r.name === 'Connection Test' && r.statusCode === 404)) {
    console.log('   ⚠️  Connection test endpoint not found.');
    console.log('   → Deploy api/test-connection.js to Vercel');
  }
  
  const connectionTest = results.find(r => r.name === 'Connection Test');
  if (connectionTest && connectionTest.response) {
    if (connectionTest.response.environmentVariables) {
      const envVars = connectionTest.response.environmentVariables;
      if (envVars.AIRTABLE_API_KEY?.includes('MISSING')) {
        console.log('   ❌ AIRTABLE_API_KEY is missing in Vercel environment variables');
      }
      if (envVars.AIRTABLE_BASE_ID?.includes('MISSING')) {
        console.log('   ❌ AIRTABLE_BASE_ID is missing in Vercel environment variables');
      }
    }
    
    if (connectionTest.response.airtableTest && !connectionTest.response.airtableTest.success) {
      console.log('   ❌ Airtable connection failed');
      console.log('   → Check if API key and Base ID are correct in Vercel');
      console.log('   → Check if environment variables are set for Production environment');
    }
  }
  
  const webhookTest = results.find(r => r.name.includes('Webhook'));
  if (webhookTest && webhookTest.statusCode === 404) {
    console.log('   ❌ Webhook endpoint not found');
    console.log('   → Deploy api/webhook/calendly.js to Vercel');
  }
  
  console.log('\n');
}

runTests().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
