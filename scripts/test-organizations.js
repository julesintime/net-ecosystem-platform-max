#!/usr/bin/env node

/**
 * Test script for organization functionality
 */

async function testOrganizationEndpoints() {
  const baseUrl = 'http://localhost:6789';
  
  console.log('🧪 Testing Organization Endpoints...\n');
  
  // Test 1: Check organizations endpoint (should fail without auth)
  console.log('📍 Test 1: Check organizations endpoint without auth');
  try {
    const response = await fetch(`${baseUrl}/api/organizations/check`);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly returns 401 for unauthenticated request');
    } else {
      console.log('❌ Unexpected response:', response.status, data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: Check if onboarding page is accessible
  console.log('\n📍 Test 2: Check onboarding page accessibility');
  try {
    const response = await fetch(`${baseUrl}/onboarding`);
    
    if (response.ok) {
      console.log('✅ Onboarding page is accessible');
      const html = await response.text();
      
      // Check for expected elements
      if (html.includes('Create Organization') || html.includes('Welcome')) {
        console.log('✅ Onboarding page has expected content');
      } else {
        console.log('⚠️ Onboarding page might be missing expected content');
      }
    } else {
      console.log('❌ Onboarding page returned:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 3: Check if organization API endpoints are defined
  console.log('\n📍 Test 3: Check organization API endpoints');
  const endpoints = [
    '/api/organizations',
    '/api/organizations/check',
    '/api/organizations/create'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'HEAD'
      });
      
      // Even 401/405 means the endpoint exists
      if (response.status === 401 || response.status === 405 || response.ok) {
        console.log(`✅ ${endpoint} endpoint exists`);
      } else {
        console.log(`⚠️ ${endpoint} returned: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} error:`, error.message);
    }
  }
  
  console.log('\n🏁 Organization endpoint tests complete!');
}

// Run tests
testOrganizationEndpoints().catch(console.error);