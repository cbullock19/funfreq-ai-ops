// Helper script to get Instagram Business Account ID
// Run with: node scripts/get-instagram-id.js

const META_ACCESS_TOKEN = 'EAALKghCnDO4BPNYntoTH0Oynr0Oynr0QdqfOxMXvbioXnFF66L3wrEhcXYF086mwb5uO4CB2lEYVMZA1ZB7ny417AFbeCLDrNa3XjycBRsZAz6t4Sqyd0ay4EDXhcZBcZA1S0xnAMgOxhJkEzn4YnQc5AKYQ1GvOIJZBXyXxkZCbsRG6ZAmLww3NS6ZCbo2W5CYd0NUAxYVtYfuZAS9WnhNqZA31ZBWDaeqBgGkdHVzBzTPufiGkZD'
const META_PAGE_ID = '604489102757371'

async function getInstagramBusinessAccountId() {
  try {
    console.log('🔍 Getting Instagram Business Account ID...')
    
    // Step 1: Get Instagram account connected to your Facebook page
    const response = await fetch(`https://graph.facebook.com/v18.0/${META_PAGE_ID}?fields=instagram_business_account&access_token=${META_ACCESS_TOKEN}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to get Instagram account: ${error.error?.message || 'Unknown error'}`)
    }
    
    const data = await response.json()
    
    if (!data.instagram_business_account) {
      console.log('❌ No Instagram Business Account found!')
      console.log('📋 To fix this:')
      console.log('1. Go to your Facebook Page Settings')
      console.log('2. Connect your Instagram Business Account')
      console.log('3. Make sure Instagram account is set to Business/Creator mode')
      return
    }
    
    const instagramId = data.instagram_business_account.id
    console.log('✅ Instagram Business Account ID found!')
    console.log(`📱 Instagram ID: ${instagramId}`)
    console.log('')
    console.log('🔧 Add this to your .env.local:')
    console.log(`INSTAGRAM_USER_ID=${instagramId}`)
    console.log('')
    console.log('📝 Next step: Get Instagram access token')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

getInstagramBusinessAccountId() 