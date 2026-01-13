// Test endpoint to verify Airtable connection and environment variables
// Deploy this to: api/test-connection.js
// Access at: /api/test-connection

const https = require('https');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;

const TABLE_ID = 'tblHlxqoaGlTZmKqL'; // Reservations table

function makeAirtableRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            body: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: { rawBody: body, parseError: e.message },
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testConnection() {
  console.log('🧪 Testing Vercel Server Connection...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    environmentVariables: {
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? `${AIRTABLE_API_KEY.substring(0, 20)}...` : '❌ MISSING',
      AIRTABLE_BASE_ID: AIRTABLE_BASE_ID || '❌ MISSING',
      CALENDLY_API_KEY: CALENDLY_API_KEY ? `${CALENDLY_API_KEY.substring(0, 20)}...` : '⚠️ OPTIONAL'
    },
    airtableTest: null,
    status: 'unknown'
  };

  // Check environment variables
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    results.status = 'error';
    results.error = 'Missing required environment variables';
    return results;
  }

  // Test Airtable connection
  try {
    const testPath = `/v0/${AIRTABLE_BASE_ID}/${TABLE_ID}?maxRecords=1`;
    console.log('📡 Testing Airtable connection...');
    const response = await makeAirtableRequest(testPath);
    
    results.airtableTest = {
      statusCode: response.statusCode,
      success: response.statusCode === 200,
      recordsFound: response.body.records?.length || 0,
      error: response.statusCode !== 200 ? (response.body.error?.message || 'Unknown error') : null
    };

    if (response.statusCode === 200) {
      results.status = 'success';
      console.log('✅ Airtable connection successful!');
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      results.status = 'error';
      results.error = 'Airtable authorization failed - check API key';
      console.log('❌ Airtable authorization failed');
    } else {
      results.status = 'error';
      results.error = `Airtable returned status ${response.statusCode}`;
      console.log(`⚠️ Airtable returned status ${response.statusCode}`);
    }
    
  } catch (error) {
    results.status = 'error';
    results.error = error.message;
    results.airtableTest = {
      error: error.message
    };
    console.log('❌ Error testing Airtable:', error.message);
  }

  return results;
}

// Export for Vercel serverless function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const results = await testConnection();
    
    res.status(results.status === 'success' ? 200 : 500).json({
      status: results.status,
      ...results
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Allow running as standalone script
if (require.main === module) {
  testConnection().then(results => {
    console.log('\n📊 Test Results:');
    console.log(JSON.stringify(results, null, 2));
    process.exit(results.status === 'success' ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
