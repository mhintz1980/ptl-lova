import { createClient } from '@supabase/supabase-js'

const url =
  process.env.SUPABASE_URL || 'https://zqwrkiehsxawwsueedwd.supabase.co'
const key = process.env.SUPABASE_ANON_KEY

if (!key) {
  console.error('Error: SUPABASE_ANON_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(url, key)

async function resetPassword() {
  const email = 'engineering@msp-pumps.com'
  console.log(`Sending password reset email to ${email}...`)

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://ptl-lova.vercel.app/update-password',
  })

  if (error) {
    console.error('Error sending reset email:', error)
  } else {
    console.log('Reset email sent successfully:', data)
  }
}

resetPassword()
