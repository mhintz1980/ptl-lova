# Support Operations Guide

This document contains standard operating procedures (SOPs) for common support tasks.

## User Management

### Reset Password

To send a password reset email to a user:

1.  **Verify User Exists**:
    Check the `auth.users` table in Supabase.

    ```sql
    select id, email from auth.users where email = 'target@email.com';
    ```

2.  **Run Reset Script**:
    Use the `reset-password.js` script in the `scripts/` directory.

    Edit `scripts/reset-password.js` to set the target email:

    ```javascript
    const email = 'target@email.com'
    ```

    Then run:

    ```bash
    node scripts/reset-password.js
    ```

    **Note**: This script uses the Supabase JS client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local` (or hardcoded for admin tasks if needed). The method used is `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`.
