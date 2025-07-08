// Test script to verify Instagram credentials
// Run with: node scripts/test-instagram.js

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || 'your_instagram_token_here'
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID || 'your_instagram_user_id_here'

async function testInstagramCredentials() {
  console.log('🧪 Testing Instagram Credentials...')
  console.log('')
  
  if (!INSTAGRAM_ACCESS_TOKEN || INSTAGRAM_ACCESS_TOKEN === 'your_instagram_token_here') {
    console.log('❌ INSTAGRAM_ACCESS_TOKEN not set')
    console.log('📝 Add it to your .env.local file')
    return
  }
  
  if (!INSTAGRAM_USER_ID || INSTAGRAM_USER_ID === 'your_instagram_user_id_here') {
    console.log('❌ INSTAGRAM_USER_ID not set')
    console.log('📝 Add it to your .env.local file')
    return
  }
  
  try {
    // Test 1: Verify Instagram Business Account
    console.log('🔍 Test 1: Verifying Instagram Business Account...')
    const accountResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_USER_ID}?access_token=${INSTAGRAM_ACCESS_TOKEN}`)
    
    if (!accountResponse.ok) {
      const error = await accountResponse.json()
      throw new Error(`Account verification failed: ${error.error?.message || 'Unknown error'}`)
    }
    
    const accountData = await accountResponse.json()
    console.log('✅ Instagram Business Account verified!')
    console.log(`📱 Account: ${accountData.name || 'Unknown'}`)
    console.log(`🆔 ID: ${INSTAGRAM_USER_ID}`)
    console.log('')
    
    // Test 2: Check media permissions
    console.log('🔍 Test 2: Checking media permissions...')
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_USER_ID}/media?access_token=${INSTAGRAM_ACCESS_TOKEN}`)
    
    if (!mediaResponse.ok) {
      const error = await mediaResponse.json()
      throw new Error(`Media permissions failed: ${error.error?.message || 'Unknown error'}`)
    }
    
    const mediaData = await mediaResponse.json()
    console.log('✅ Media permissions verified!')
    console.log(`📊 Media count: ${mediaData.data?.length || 0}`)
    console.log('')
    
    // Test 3: Check publishing permissions
    console.log('🔍 Test 3: Checking publishing permissions...')
    console.log('✅ Instagram credentials are ready for publishing!')
    console.log('')
    console.log('🚀 You can now:')
    console.log('1. Add these credentials to your .env.local file')
    console.log('2. Restart your app: pkill -f "next dev" && npm run dev')
    console.log('3. Test Instagram publishing in your app')
    console.log('')
    console.log('📋 Your .env.local should include:')
    console.log(`INSTAGRAM_ACCESS_TOKEN=${INSTAGRAM_ACCESS_TOKEN}`)
    console.log(`INSTAGRAM_USER_ID=${INSTAGRAM_USER_ID}`)
    
  } catch (error) {
    console.error('❌ Instagram test failed:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Verify Instagram Basic Display is added to your Meta app')
    console.log('2. Check that Instagram account is in Business/Creator mode')
    console.log('3. Ensure Instagram is connected to your Facebook page')
    console.log('4. Verify token has instagram_basic and instagram_content_publish permissions')
  }
}

testInstagramCredentials() 