#!/usr/bin/env node

/**
 * Script to add the current user to an organization
 * Usage: node scripts/add-user-to-organization.js <userId> <organizationId>
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function getM2MToken() {
  const tokenUrl = `${process.env.LOGTO_ENDPOINT}/oidc/token`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.LOGTO_M2M_APP_ID,
    client_secret: process.env.LOGTO_M2M_APP_SECRET,
    resource: process.env.LOGTO_MANAGEMENT_API_RESOURCE,
    scope: 'all'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    throw new Error(`Failed to get M2M token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function addUserToOrganization(userId, organizationId) {
  const token = await getM2MToken();
  
  const response = await fetch(
    `${process.env.LOGTO_MANAGEMENT_API_RESOURCE}/organizations/${organizationId}/users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userIds: [userId] })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add user to organization: ${response.statusText}. ${error}`);
  }

  console.log(`✅ Successfully added user ${userId} to organization ${organizationId}`);
}

// Main execution
(async () => {
  try {
    const userId = process.argv[2] || 'pa9i7mvzpxo4'; // Your user ID
    const organizationId = process.argv[3] || 'lw9zzloe3d5a'; // ACME Corporation
    
    console.log(`🎯 Adding user ${userId} to organization ${organizationId}...`);
    await addUserToOrganization(userId, organizationId);
    
    console.log('\n📝 Next steps:');
    console.log('1. Sign out and sign back in to refresh your token with organization claims');
    console.log('2. Navigate to /profile/ecosystem-apps');
    console.log('3. You should now be able to grant consent and request access');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();