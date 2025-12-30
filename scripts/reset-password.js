
import { createClient } from '@supabase/supabase-js'

const url = 'https://zqwrkiehsxawwsueedwd.supabase.co'
// Using service_role key would be better for admin tasks, but anon with resetPasswordForEmail works too
// actually resetPasswordForEmail sends an email, which is what we want.
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxd3JraWVoc3hhd3dzdWVlZHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzEzNjcsImV4cCI6MjA4MjAwNzM2N30.PgtOPIQ2nhwkuGfNStZtCtj_1oc5tOr5Jo11Cem0Pp4'

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
