#!/usr/bin/env node

/**
 * Test script for OAuth callback error scenarios
 * This script simulates various OAuth error conditions to test error handling
 */

const CALLBACK_ROUTES = [
  'http://localhost:6789/api/logto/callback', // SDK route
  'http://localhost:6789/callback'             // Custom route
];

const ERROR_SCENARIOS = [
  {
    name: 'Invalid State Parameter',
    params: {
      code: 'valid_looking_code_123',
      state: 'invalid_state_parameter'
    },
    description: 'Tests OAuth state parameter validation'
  },
  {
    name: 'Missing Code Parameter', 
    params: {
      state: 'valid_state_parameter'
    },
    description: 'Tests handling of missing authorization code'
  },
  {
    name: 'Missing State Parameter',
    params: {
      code: 'valid_looking_code_123'
    },
    description: 'Tests handling of missing state parameter'
  },
  {
    name: 'Expired/Invalid Code',
    params: {
      code: 'expired_or_invalid_code_xyz',
      state: 'valid_state_parameter'
    },
    description: 'Tests handling of expired authorization codes'
  },
  {
    name: 'Malformed Parameters',
    params: {
      code: 'code with spaces and special chars!@#',
      state: 'state with spaces'
    },
    description: 'Tests parameter validation and sanitization'
  }
];

async function testScenario(route, scenario) {
  const url = new URL(route);
  Object.entries(scenario.params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  console.log(`\n🔍 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`🔗 URL: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📍 Location Header: ${response.headers.get('location') || 'None'}`);
    
    // Try to read response body if available
    try {
      const text = await response.text();
      if (text && text.length > 0) {
        console.log(`📄 Response Body: ${text.substring(0, 200)}...`);
      }
    } catch (e) {
      // Ignore body read errors
    }
    
    return {
      status: response.status,
      location: response.headers.get('location'),
      success: false
    };
  } catch (error) {
    console.log(`❌ Request Error: ${error.message}`);
    return {
      error: error.message,
      success: false
    };
  }
}

async function runTests() {
  console.log('🚀 Starting OAuth Error Scenario Testing');
  console.log('📋 Testing both SDK and custom callback routes\n');

  for (const route of CALLBACK_ROUTES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Testing Route: ${route}`);
    console.log('='.repeat(60));

    for (const scenario of ERROR_SCENARIOS) {
      await testScenario(route, scenario);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n✅ Testing completed');
  console.log('\n💡 Check the Next.js development server logs for detailed error information');
  console.log('💡 Look for "=== LOGTO SDK CALLBACK DEBUG ===" and "=== CUSTOM CALLBACK ROUTE DEBUG ===" logs');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:6789/api/health');
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server is not running on localhost:6789');
    console.log('🔧 Start the server with: npm run dev');
    process.exit(1);
  }
  
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testScenario, ERROR_SCENARIOS };