#!/usr/bin/env node

// Script to fix Logto configuration using M2M credentials
// This will add the missing postLogoutRedirectUris to the SPA application

const https = require('https');
const { URLSearchParams } = require('url');

// Configuration from .env.local
const config = {
  endpoint: 'https://z3zlta.logto.app',
  m2mAppId: 'wcjwd10m66h51xsqn8e69',
  m2mAppSecret: 'Uga94IsYrPMIjpL2Gjgs8apQNgrFsXY8',
  managementApiResource: 'https://z3zlta.logto.app/api',
  spaAppId: 'm07bzoq8ltp8fswv7m2y8',
  redirectUri: 'http://localhost:6789'
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
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
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
    throw new Error(`M2M token request failed: ${response.status} ${JSON.stringify(response.data)}`);
  }

  console.log('✅ M2M token obtained successfully');
  return response.data.access_token;
}

async function getCurrentSpaConfig(token) {
  console.log('📋 Getting current SPA application configuration...');
  
  const response = await makeRequest(`${config.managementApiResource}/applications/${config.spaAppId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status !== 200) {
    throw new Error(`Failed to get SPA config: ${response.status} ${JSON.stringify(response.data)}`);
  }

  console.log('✅ Current SPA configuration retrieved');
  console.log('Current postLogoutRedirectUris:', response.data.oidcClientMetadata?.postLogoutRedirectUris || []);
  console.log('Current corsAllowedOrigins:', response.data.customClientMetadata?.corsAllowedOrigins || []);
  
  return response.data;
}

async function updateSpaConfig(token, currentConfig) {
  console.log('🔧 Updating SPA application configuration...');
  
  // Prepare the update payload
  const currentPostLogout = currentConfig.oidcClientMetadata?.postLogoutRedirectUris || [];
  const currentCors = currentConfig.customClientMetadata?.corsAllowedOrigins || [];
  
  // Add our redirect URI if it's not already there
  const newPostLogout = currentPostLogout.includes(config.redirectUri) 
    ? currentPostLogout 
    : [...currentPostLogout, config.redirectUri];
    
  const newCors = currentCors.includes(config.redirectUri) 
    ? currentCors 
    : [...currentCors, config.redirectUri];

  const updatePayload = {
    oidcClientMetadata: {
      ...currentConfig.oidcClientMetadata,
      postLogoutRedirectUris: newPostLogout
    },
    customClientMetadata: {
      ...currentConfig.customClientMetadata,
      corsAllowedOrigins: newCors
    }
  };

  console.log('Update payload:');
  console.log('- postLogoutRedirectUris:', updatePayload.oidcClientMetadata.postLogoutRedirectUris);
  console.log('- corsAllowedOrigins:', updatePayload.customClientMetadata.corsAllowedOrigins);

  const response = await makeRequest(`${config.managementApiResource}/applications/${config.spaAppId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatePayload)
  });

  if (response.status !== 200) {
    throw new Error(`Failed to update SPA config: ${response.status} ${JSON.stringify(response.data)}`);
  }

  console.log('✅ SPA application configuration updated successfully!');
  return response.data;
}

async function main() {
  try {
    console.log('🚀 Starting Logto configuration fix...\n');
    
    // Step 1: Get M2M token
    const token = await getM2MToken();
    
    // Step 2: Get current configuration
    const currentConfig = await getCurrentSpaConfig(token);
    
    // Step 3: Update configuration
    const updatedConfig = await updateSpaConfig(token, currentConfig);
    
    console.log('\n🎉 Logto configuration fix completed successfully!');
    console.log('\nThe following changes were applied:');
    console.log('- postLogoutRedirectUris now includes:', config.redirectUri);
    console.log('- corsAllowedOrigins now includes:', config.redirectUri);
    console.log('\n✅ Sign-out should now work without OIDC redirect URI errors');
    
  } catch (error) {
    console.error('\n❌ Failed to fix Logto configuration:');
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}