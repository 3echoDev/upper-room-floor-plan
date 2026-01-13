// Script to test if Airtable API key and base ID are correct
const https = require('https');

const AIRTABLE_API_KEY = 'patFAhxAehjS7ooW4.065ff8cc4680ea7a527f2315d465c76dc530b6fd692f4ad456ca75bd9aa1af9d';
const AIRTABLE_BASE_ID = 'appHXyKvdB7cU3qF7';
const TABLE_ID = 'tbl9dDLnVa5oLEnuq';

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ success: true, statusCode: res.statusCode, data: parsed });
          } else {
            const parsed = body ? JSON.parse(body) : {};
            reject({ 
              success: false, 
              statusCode: res.statusCode, 
              error: parsed 
            });
          }
        } catch (e) {
          reject({ 
            success: false, 
            statusCode: res.statusCode, 
            error: { message: `Parse error: ${body}` } 
          });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testAirtableConnection() {
  console.log('🔍 Testing Airtable API Key and Base ID...\n');
  console.log(`API Key: ${AIRTABLE_API_KEY.substring(0, 20)}...`);
  console.log(`Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`Table ID: ${TABLE_ID}\n`);
  
  try {
    // Test by fetching one record (maxRecords=1 for efficiency)
    const testUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_ID}?maxRecords=1&sort[0][field]=DateandTime&sort[0][direction]=desc`;
    
    console.log('📡 Testing connection to Airtable...');
    const result = await makeRequest({
      hostname: 'api.airtable.com',
      path: `/v0/${AIRTABLE_BASE_ID}/${TABLE_ID}?maxRecords=1&sort%5B0%5D%5Bfield%5D=DateandTime&sort%5B0%5D%5Bdirection%5D=desc`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ SUCCESS! Airtable credentials are valid!');
    console.log(`   Status: ${result.statusCode}`);
    console.log(`   Records found: ${result.data.records?.length || 0}`);
    console.log('\n✅ These credentials are correct and can be used in Vercel.');
    console.log('\n📝 Next step:');
    console.log('   Make sure these are set in Vercel Dashboard → Settings → Environment Variables:');
    console.log(`   - AIRTABLE_API_KEY = ${AIRTABLE_API_KEY}`);
    console.log(`   - AIRTABLE_BASE_ID = ${AIRTABLE_BASE_ID}`);
    
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      console.log('\n❌ ERROR: NOT_AUTHORIZED');
      console.log('   This means:');
      console.log('   - API key is invalid or expired');
      console.log('   - API key doesn\'t have access to this base');
      console.log('   - API key permissions are incorrect');
      console.log('\n   You need to:');
      console.log('   1. Go to Airtable → Account → Developer hub');
      console.log('   2. Create a new Personal Access Token');
      console.log('   3. Make sure it has access to the base: appHXyKvdB7cU3qF7');
      console.log('   4. Update the key in both your code and Vercel');
    } else if (error.statusCode === 404) {
      console.log('\n❌ ERROR: Base or Table not found');
      console.log('   Check:');
      console.log(`   - Base ID is correct: ${AIRTABLE_BASE_ID}`);
      console.log(`   - Table ID is correct: ${TABLE_ID}`);
    } else {
      console.log('\n❌ ERROR:', error.statusCode, error.error);
    }
    process.exit(1);
  }
}

testAirtableConnection();

