---
description: Refresh the local test data and run the specific seeding scripts without touching beta.
---

// turbo-all

1. Reset the local Supabase environment (drops schema and re-applies migrations): `npx supabase db reset`
2. Run the debug seed script to generate test data (POs, pumps, etc.): `node debug-seed.js`
3. Print out a summary of the test data created and the login credentials for testing.
