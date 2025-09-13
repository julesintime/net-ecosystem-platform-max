#!/usr/bin/env node
/**
 * Logto Configuration Backup Script
 * Creates a complete backup of current Logto configuration
 */

const https = require('https');
const fs = require('fs');
const querystring = require('querystring');

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT;
const M2M_APP_ID = process.env.LOGTO_M2M_APP_ID;
const M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET;
const MANAGEMENT_API_RESOURCE = 'https://z3zlta.logto.app/api'; // Known working resource
const SPA_APP_ID = process.env.LOGTO_APP_ID;

console.log('📋 Logto Configuration Backup');
console.log('==============================');

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

// Get management API token
async function getToken() {
  const tokenUrl = new URL('/oidc/token', LOGTO_ENDPOINT);
  
  const tokenPayload = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: M2M_APP_ID,
    client_secret: M2M_APP_SECRET,
    resource: MANAGEMENT_API_RESOURCE,
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
    throw new Error(`Failed to get token: ${JSON.stringify(tokenResponse.data)}`);
  }

  return tokenResponse.data.access_token;
}

// Get application configuration
async function getAppConfig(token, appId) {
  const appUrl = new URL(`/api/applications/${appId}`, LOGTO_ENDPOINT);
  
  const appOptions = {
    hostname: appUrl.hostname,
    port: appUrl.port || 443,
    path: appUrl.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  const response = await makeRequest(appOptions);
  
  if (response.statusCode !== 200) {
    throw new Error(`Failed to get app config: ${response.statusCode}`);
  }

  return response.data;
}

// Get organization templates
async function getOrganizationTemplates(token) {
  const templatesUrl = new URL('/api/organization-templates', LOGTO_ENDPOINT);
  
  const options = {
    hostname: templatesUrl.hostname,
    port: templatesUrl.port || 443,
    path: templatesUrl.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  const response = await makeRequest(options);
  
  if (response.statusCode === 200) {
    return response.data;
  } else {
    console.log(`⚠️  Organization templates not available (${response.statusCode})`);
    return null;
  }
}

// Get all applications
async function getAllApplications(token) {
  const appsUrl = new URL('/api/applications', LOGTO_ENDPOINT);
  
  const options = {
    hostname: appsUrl.hostname,
    port: appsUrl.port || 443,
    path: appsUrl.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  const response = await makeRequest(options);
  
  if (response.statusCode !== 200) {
    throw new Error(`Failed to get applications: ${response.statusCode}`);
  }

  return response.data;
}

// Main backup function
async function createBackup() {
  try {
    console.log('\n🔐 Getting Management API token...');
    const token = await getToken();
    console.log('✅ Token obtained successfully');

    const backup = {
      timestamp: new Date().toISOString(),
      logtoEndpoint: LOGTO_ENDPOINT,
      backupVersion: '1.0',
      configuration: {}
    };

    console.log('\n📱 Backing up SPA application configuration...');
    const spaConfig = await getAppConfig(token, SPA_APP_ID);
    backup.configuration.spaApplication = spaConfig;
    console.log(`✅ SPA App: ${spaConfig.name} (${spaConfig.id})`);

    console.log('\n🤖 Backing up M2M application configuration...');
    const m2mConfig = await getAppConfig(token, M2M_APP_ID);
    backup.configuration.m2mApplication = m2mConfig;
    console.log(`✅ M2M App: ${m2mConfig.name} (${m2mConfig.id})`);

    console.log('\n📋 Backing up all applications...');
    const allApps = await getAllApplications(token);
    backup.configuration.allApplications = allApps;
    console.log(`✅ Found ${allApps.length} applications`);

    console.log('\n🏢 Backing up organization templates...');
    const orgTemplates = await getOrganizationTemplates(token);
    if (orgTemplates) {
      backup.configuration.organizationTemplates = orgTemplates;
      console.log(`✅ Found ${Array.isArray(orgTemplates) ? orgTemplates.length : 'unknown'} templates`);
    }

    // Write backup to file
    const backupPath = `/Users/xoojulian/Downloads/net-ecosystem-platform-max/logto-config-backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`\n💾 Configuration backup saved to: ${backupPath}`);

    // Generate analysis report
    console.log('\n📊 Configuration Analysis:');
    
    // Check redirect URIs
    console.log('\n🔗 Redirect URIs Analysis:');
    if (spaConfig.redirectUris && spaConfig.redirectUris.length > 0) {
      spaConfig.redirectUris.forEach((uri, index) => {
        console.log(`   ${index + 1}. ${uri}`);
        if (uri === process.env.LOGTO_REDIRECT_URI) {
          console.log(`      ✅ Matches LOGTO_REDIRECT_URI`);
        }
      });
    } else {
      console.log(`   ❌ NO REDIRECT URIs CONFIGURED`);
      console.log(`   📝 Missing: ${process.env.LOGTO_REDIRECT_URI}`);
    }

    // Check post-logout redirect URIs
    console.log('\n🚪 Post-Logout Redirect URIs Analysis:');
    if (spaConfig.postLogoutRedirectUris && spaConfig.postLogoutRedirectUris.length > 0) {
      spaConfig.postLogoutRedirectUris.forEach((uri, index) => {
        console.log(`   ${index + 1}. ${uri}`);
        if (uri === process.env.LOGTO_BASE_URL) {
          console.log(`      ✅ Matches LOGTO_BASE_URL`);
        }
      });
    } else {
      console.log(`   ❌ NO POST-LOGOUT REDIRECT URIs CONFIGURED`);
      console.log(`   📝 Missing: ${process.env.LOGTO_BASE_URL}`);
    }

    // Check CORS origins
    console.log('\n🌐 CORS Origins Analysis:');
    if (spaConfig.customData && spaConfig.customData.corsSettings) {
      console.log(`   CORS settings found in customData`);
    } else {
      console.log(`   ⚠️  CORS settings not visible or not configured`);
    }

    console.log('\n🎯 Critical Issues Identified:');
    let issueCount = 0;
    
    if (!spaConfig.redirectUris || spaConfig.redirectUris.length === 0) {
      issueCount++;
      console.log(`   ${issueCount}. Missing redirect URIs - will cause OAuth callback failures`);
    }
    
    if (!spaConfig.postLogoutRedirectUris || spaConfig.postLogoutRedirectUris.length === 0) {
      issueCount++;
      console.log(`   ${issueCount}. Missing post-logout redirect URIs - will cause sign-out failures`);
    }

    if (issueCount === 0) {
      console.log(`   ✅ No critical issues found`);
    }

    return backupPath;

  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    throw error;
  }
}

if (require.main === module) {
  createBackup().catch(console.error);
}