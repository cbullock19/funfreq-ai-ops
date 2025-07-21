const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease ensure these are set in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupCaptionSettings() {
  try {
    console.log('Setting up caption_settings table...')
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'caption_settings_schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('SQL Schema loaded. Please run the following SQL in your Supabase SQL editor:')
    console.log('\n' + '='.repeat(50))
    console.log(sql)
    console.log('='.repeat(50))
    console.log('\nOr copy the contents of caption_settings_schema.sql to your Supabase SQL editor.')
    
    // Try to verify if table exists
    console.log('\nChecking if table already exists...')
    const { data, error } = await supabase
      .from('caption_settings')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.log('❌ Table does not exist. Please run the SQL above.')
    } else if (error) {
      console.log('❌ Error checking table:', error)
    } else {
      console.log('✅ Table exists! Found', data.length, 'rows.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\nPlease manually run the SQL from caption_settings_schema.sql in your Supabase SQL editor.')
  }
}

setupCaptionSettings() 