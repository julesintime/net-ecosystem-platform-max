#!/usr/bin/env node

/**
 * Script to cleanup test users created during E2E testing
 */

async function cleanupTestUsers() {
  console.log('🧹 Starting test user cleanup...')
  
  try {
    // Get M2M token for Management API
    const tokenUrl = `${process.env.LOGTO_ENDPOINT}/oidc/token`
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LOGTO_M2M_APP_ID,
      client_secret: process.env.LOGTO_M2M_APP_SECRET,
      resource: process.env.LOGTO_MANAGEMENT_API_RESOURCE,
      scope: 'all'
    })
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get M2M access token')
    }
    
    const { access_token } = await tokenResponse.json()
    console.log('✅ Got M2M access token')
    
    // Get all users
    const managementApiUrl = process.env.LOGTO_MANAGEMENT_API_RESOURCE
    const usersResponse = await fetch(`${managementApiUrl}/users`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      }
    })
    
    if (!usersResponse.ok) {
      throw new Error('Failed to fetch users')
    }
    
    const users = await usersResponse.json()
    console.log(`📋 Found ${users.length} total users`)
    
    // Filter test users (those starting with 'testuser_')
    const testUsers = users.filter(user => 
      user.username && user.username.startsWith('testuser_')
    )
    
    console.log(`🎯 Found ${testUsers.length} test users to delete:`)
    testUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.id})`)
    })
    
    if (testUsers.length === 0) {
      console.log('✅ No test users found to cleanup')
      return
    }
    
    // Delete each test user
    let deletedCount = 0
    for (const user of testUsers) {
      try {
        const deleteResponse = await fetch(`${managementApiUrl}/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${access_token}`,
          }
        })
        
        if (deleteResponse.ok) {
          console.log(`   ✅ Deleted: ${user.username}`)
          deletedCount++
        } else {
          console.log(`   ❌ Failed to delete: ${user.username} (${deleteResponse.status})`)
        }
      } catch (error) {
        console.log(`   ❌ Error deleting ${user.username}:`, error.message)
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`\n🎉 Cleanup complete: ${deletedCount}/${testUsers.length} test users deleted`)
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    process.exit(1)
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupTestUsers().catch(console.error)
}

module.exports = { cleanupTestUsers }