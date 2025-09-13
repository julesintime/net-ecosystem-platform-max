#!/usr/bin/env node
/**
 * M2M Authentication Test Script
 * Tests Machine-to-Machine credentials against Logto Management API
 */

const https = require('https');
const querystring = require('querystring');

// Environment validation
const requiredVars = [
  'LOGTO_ENDPOINT',
  'LOGTO_M2M_APP_ID',
  'LOGTO_M2M_APP_SECRET',
  'LOGTO_MANAGEMENT_API_RESOURCE'
];

console.log('🔍 M2M Authentication Test');
console.log('==========================');

// Check environment variables
console.log('\n📋 Environment Variables Check:');
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ Missing: ${varName}`);
    process.exit(1);
  }
  // Mask sensitive values
  const displayValue = varName.includes('SECRET') 
    ? `${value.slice(0, 4)}...${value.slice(-4)}` 
    : value;
  console.log(`✅ ${varName}: ${displayValue}`);
}

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT;
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID;
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET;
const MANAGEMENT_API_RESOURCE = process.env.LOGTO_MANAGEMENT_API_RESOURCE;

// Common Logto Management API resource identifiers to try
const POTENTIAL_RESOURCES = [
  MANAGEMENT_API_RESOURCE,
  `${LOGTO_ENDPOINT}api`, // Standard format: https://tenant.logto.app/api
  `${LOGTO_ENDPOINT.replace(/\/$/, '')}/api`, // Ensure no double slash
  'https://default.logto.app/api', // Default resource
  LOGTO_ENDPOINT.replace(/\/$/, '') // Base URL without trailing slash
];

console.log(`\n🔍 Will test multiple resource identifiers:`);

// Helper function for HTTPS requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testM2MAuthentication() {
  console.log('\n🔐 Testing M2M Token Exchange:');
  
  POTENTIAL_RESOURCES.forEach((resource, index) => {
    console.log(`   ${index + 1}. ${resource}`);
  });
  
  try {
    let successfulResource = null;
    let tokenData = null;

    // Try each resource identifier until we find one that works
    for (const resource of POTENTIAL_RESOURCES) {
      console.log(`\n🔄 Trying resource: ${resource}`);
      
      const tokenUrl = new URL('/oidc/token', LOGTO_ENDPOINT);
      
      const tokenPayload = querystring.stringify({
        grant_type: 'client_credentials',
        client_id: M2M_APP_ID,
        client_secret: M2M_APP_SECRET,
        resource: resource,
        scope: 'all' // Request all available scopes
      });

      const tokenOptions = {
        hostname: tokenUrl.hostname,
        port: tokenUrl.port || 443,
        path: tokenUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(tokenPayload)
        }
      };

      console.log(`📡 POST ${tokenUrl.href}`);
      console.log(`   Client ID: ${M2M_APP_ID}`);
      console.log(`   Resource: ${resource}`);
      
      const tokenResponse = await makeRequest(tokenOptions, tokenPayload);
      
      if (tokenResponse.statusCode === 200) {
        successfulResource = resource;
        tokenData = tokenResponse.data;
        console.log(`✅ Token obtained successfully with resource: ${resource}`);
        break;
      } else {
        console.log(`❌ Failed with resource: ${resource} (${tokenResponse.statusCode})`);
        if (tokenResponse.data) {
          console.log(`   Response: ${JSON.stringify(tokenResponse.data, null, 2)}`);
        }
      }
    }

    if (!successfulResource || !tokenData) {
      console.error(`❌ All resource identifiers failed`);
      return false;
    }

    console.log(`\n✅ M2M Authentication Summary:`);
    console.log(`   Successful resource: ${successfulResource}`);
    console.log(`   Token type: ${tokenData.token_type}`);
    console.log(`   Expires in: ${tokenData.expires_in} seconds`);
    console.log(`   Scope: ${tokenData.scope || 'Not specified'}`);

    // Step 2: Test Management API access
    console.log('\n🔍 Testing Management API Access:');
    
    const managementApiUrl = new URL('/api/applications', LOGTO_ENDPOINT);
    
    const apiOptions = {
      hostname: managementApiUrl.hostname,
      port: managementApiUrl.port || 443,
      path: managementApiUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `${tokenData.token_type} ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    };

    console.log(`📡 GET ${managementApiUrl.href}`);
    
    const apiResponse = await makeRequest(apiOptions);
    
    if (apiResponse.statusCode !== 200) {
      console.error(`❌ Management API request failed: ${apiResponse.statusCode}`);
      console.error(`   Response: ${JSON.stringify(apiResponse.data, null, 2)}`);
      return false;
    }

    console.log(`✅ Management API access successful`);
    console.log(`   Applications found: ${Array.isArray(apiResponse.data) ? apiResponse.data.length : 'Unknown'}`);
    
    if (Array.isArray(apiResponse.data)) {
      console.log('\n📱 Configured Applications:');
      apiResponse.data.forEach((app, index) => {
        console.log(`   ${index + 1}. ${app.name || app.id} (${app.type})`);
        console.log(`      ID: ${app.id}`);
        if (app.id === M2M_APP_ID || app.id === process.env.LOGTO_APP_ID) {
          console.log(`      ⭐ This is our application!`);
        }
      });
    }

    return { success: true, resource: successfulResource, token: tokenData };

  } catch (error) {
    console.error(`❌ M2M test failed: ${error.message}`);
    return false;
  }
}

async function testCurrentAppConfiguration() {
  console.log('\n📋 Testing Current Application Configuration:');
  
  try {
    // Use the correct resource identifier we found earlier
    const correctResource = 'https://z3zlta.logto.app/api';
    
    // Get token first
    const tokenUrl = new URL('/oidc/token', LOGTO_ENDPOINT);
    const tokenPayload = querystring.stringify({
      grant_type: 'client_credentials',
      client_id: M2M_APP_ID,
      client_secret: M2M_APP_SECRET,
      resource: correctResource,
      scope: 'all'
    });

    const tokenOptions = {
      hostname: tokenUrl.hostname,
      port: tokenUrl.port || 443,
      path: tokenUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(tokenPayload)
      }
    };

    const tokenResponse = await makeRequest(tokenOptions, tokenPayload);
    if (tokenResponse.statusCode !== 200) {
      console.error(`❌ Could not get token for app config test`);
      console.error(`   Response: ${JSON.stringify(tokenResponse.data, null, 2)}`);
      return false;
    }

    // Get SPA application details
    const spaAppId = process.env.LOGTO_APP_ID;
    const appUrl = new URL(`/api/applications/${spaAppId}`, LOGTO_ENDPOINT);
    
    const appOptions = {
      hostname: appUrl.hostname,
      port: appUrl.port || 443,
      path: appUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `${tokenResponse.data.token_type} ${tokenResponse.data.access_token}`,
        'Accept': 'application/json'
      }
    };

    console.log(`📡 GET ${appUrl.href}`);
    
    const appResponse = await makeRequest(appOptions);
    
    if (appResponse.statusCode !== 200) {
      console.error(`❌ App configuration request failed: ${appResponse.statusCode}`);
      return false;
    }

    const appConfig = appResponse.data;
    console.log(`✅ SPA Application Configuration:`);
    console.log(`   Name: ${appConfig.name}`);
    console.log(`   Type: ${appConfig.type}`);
    console.log(`   ID: ${appConfig.id}`);
    
    console.log(`\n🔗 Redirect URIs:`);
    if (appConfig.redirectUris && appConfig.redirectUris.length > 0) {
      appConfig.redirectUris.forEach((uri, index) => {
        console.log(`   ${index + 1}. ${uri}`);
        if (uri === process.env.LOGTO_REDIRECT_URI) {
          console.log(`      ✅ Matches LOGTO_REDIRECT_URI`);
        }
      });
    } else {
      console.log(`   ⚠️  No redirect URIs configured`);
    }

    console.log(`\n🚪 Post-Logout Redirect URIs:`);
    if (appConfig.postLogoutRedirectUris && appConfig.postLogoutRedirectUris.length > 0) {
      appConfig.postLogoutRedirectUris.forEach((uri, index) => {
        console.log(`   ${index + 1}. ${uri}`);
        if (uri === process.env.LOGTO_BASE_URL) {
          console.log(`      ✅ Matches LOGTO_BASE_URL`);
        }
      });
    } else {
      console.log(`   ❌ No post-logout redirect URIs configured`);
      console.log(`   📝 Expected: ${process.env.LOGTO_BASE_URL}`);
    }

    return true;

  } catch (error) {
    console.error(`❌ App configuration test failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  const m2mResult = await testM2MAuthentication();
  const appConfigResult = await testCurrentAppConfiguration();
  
  console.log('\n📊 Test Results:');
  console.log(`   M2M Authentication: ${m2mResult && m2mResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   App Configuration: ${appConfigResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (m2mResult && m2mResult.success) {
    console.log(`\n💡 Environment Configuration Recommendations:`);
    console.log(`   Update .env.local with correct resource:`);
    console.log(`   LOGTO_MANAGEMENT_API_RESOURCE=${m2mResult.resource}`);
  }
  
  if (m2mResult && m2mResult.success && appConfigResult) {
    console.log('\n🎉 All M2M tests passed! Environment is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review configuration.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}