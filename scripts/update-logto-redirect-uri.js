#!/usr/bin/env node

// Script to update Logto SPA application redirect URIs

const https = require('https');
const { URLSearchParams } = require('url');

const config = {
  endpoint: 'https://z3zlta.logto.app',
  m2mAppId: 'wcjwd10m66h51xsqn8e69',
  m2mAppSecret: 'Uga94IsYrPMIjpL2Gjgs8apQNgrFsXY8',
  managementApiResource: 'https://z3zlta.logto.app/api',
  spaAppId: 'm07bzoq8ltp8fswv7m2y8',
  newRedirectUri: 'http://localhost:6789/callback'
};

async function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getM2MToken() {
  console.log('🔑 Getting M2M access token...');
  
  const tokenData = new URLSearchParams({
    grant_type: 'client_credentials',
    resource: config.managementApiResource,
    scope: 'all'
  });

  const response = await makeRequest(`${config.endpoint}/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${config.m2mAppId}:${config.m2mAppSecret}`).toString('base64')}`
    },
    body: tokenData.toString()
  });

  if (response.status !== 200) {
    throw new Error(`M2M token request failed: ${response.status}`);
  }

  return response.data.access_token;
}

async function updateRedirectUris(token) {
  console.log('📝 Updating redirect URIs...');
  
  // Get current config
  const getResponse = await makeRequest(`${config.managementApiResource}/applications/${config.spaAppId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });

  if (getResponse.status !== 200) {
    throw new Error(`Failed to get current config: ${getResponse.status}`);
  }

  const currentConfig = getResponse.data;
  console.log('Current redirectUris:', currentConfig.oidcClientMetadata?.redirectUris);
  
  // Update redirectUris to use the new callback route
  const updatePayload = {
    oidcClientMetadata: {
      ...currentConfig.oidcClientMetadata,
      redirectUris: [config.newRedirectUri]
    }
  };

  const updateResponse = await makeRequest(`${config.managementApiResource}/applications/${config.spaAppId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
  });

  if (updateResponse.status !== 200) {
    throw new Error(`Failed to update config: ${updateResponse.status}`);
  }

  console.log('✅ Redirect URI updated to:', config.newRedirectUri);
  return updateResponse.data;
}

async function main() {
  try {
    console.log('🚀 Updating Logto redirect URI configuration...\n');
    
    const token = await getM2MToken();
    await updateRedirectUris(token);
    
    console.log('\n🎉 Logto redirect URI updated successfully!');
    console.log('New redirect URI:', config.newRedirectUri);
    console.log('Make sure to restart your development server.');
    
  } catch (error) {
    console.error('\n❌ Failed to update redirect URI:', error.message);
    process.exit(1);
  }
}

main();