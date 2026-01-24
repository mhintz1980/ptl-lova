# Supabase Skills for Claude Code

Comprehensive Claude Code skills that wrap the Supabase API for database operations, authentication, storage, realtime subscriptions, and edge functions.

## Features

- **Database Operations** - CRUD operations, queries, filters, RPC functions
- **Authentication** - User management, sign up/in/out, password recovery
- **Storage** - File uploads, downloads, bucket management, signed URLs
- **Realtime** - WebSocket subscriptions to database changes, broadcast, presence
- **Edge Functions** - Deploy and invoke serverless Deno functions

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Nice-Wolf-Studio/claude-code-supabase-skills.git
cd claude-code-supabase-skills
```

### 2. Set Environment Variables

Export your Supabase credentials:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-anon-or-service-role-key"
```

**Permanent setup** (add to `~/.zshrc` or `~/.bashrc`):

```bash
echo 'export SUPABASE_URL="https://your-project.supabase.co"' >> ~/.zshrc
echo 'export SUPABASE_KEY="your-anon-or-service-role-key"' >> ~/.zshrc
source ~/.zshrc
```

### 3. Add Skills to Claude Code

Skills are automatically available in Claude Code when this repository is in your workspace. Alternatively, you can:

**Option A: Link to global skills directory**
```bash
# Create skills directory if it doesn't exist
mkdir -p ~/.claude/skills

# Link individual skills
ln -s "$(pwd)/skills/supabase-database" ~/.claude/skills/
ln -s "$(pwd)/skills/supabase-auth" ~/.claude/skills/
ln -s "$(pwd)/skills/supabase-storage" ~/.claude/skills/
ln -s "$(pwd)/skills/supabase-realtime" ~/.claude/skills/
ln -s "$(pwd)/skills/supabase-edge-functions" ~/.claude/skills/
```

**Option B: Use skills from this repository directly**

Just reference the skills when working in Claude Code - they'll be available when this project is your working directory.

## Available Skills

### supabase-database

Database operations using the Supabase REST API.

**Common operations:**
- SELECT with filters, ordering, pagination
- INSERT single or multiple rows
- UPDATE with conditions
- DELETE rows
- Call RPC functions
- Upsert operations

**Usage in Claude Code:**
```
Use the supabase-database skill to query my users table
```

### supabase-auth

Authentication and user management.

**Common operations:**
- Sign up new users
- Sign in with email/password
- Sign out users
- Get current user
- Update user metadata
- Password recovery
- Admin user management (requires service role key)

**Usage in Claude Code:**
```
Use the supabase-auth skill to create a new user account
```

### supabase-storage

File storage operations.

**Common operations:**
- Create and manage buckets
- Upload files
- Download files
- List files with filters
- Delete files
- Generate public URLs
- Create signed URLs for private files
- Image transformations

**Usage in Claude Code:**
```
Use the supabase-storage skill to upload a file to my avatars bucket
```

### supabase-realtime

Realtime WebSocket subscriptions.

**Common operations:**
- Subscribe to database table changes
- Listen for INSERT, UPDATE, DELETE events
- Broadcast messages to channels
- Track presence
- Filter subscriptions

**Usage in Claude Code:**
```
Use the supabase-realtime skill to listen for changes on my posts table
```

### supabase-edge-functions

Serverless edge functions deployment and invocation.

**Common operations:**
- Invoke edge functions
- Deploy functions via Supabase CLI
- Set environment variables/secrets
- Local function development
- View function logs

**Usage in Claude Code:**
```
Use the supabase-edge-functions skill to invoke my process-payment function
```

## Quick Start Examples

### Query Database
```bash
source scripts/supabase-api.sh

# Get all users
supabase_get "/rest/v1/users?select=*"

# Get users with filter
supabase_get "/rest/v1/users?select=*&age=gt.18&order=created_at.desc"
```

### Create User
```bash
source scripts/supabase-api.sh

# Sign up new user
supabase_post "/auth/v1/signup" '{
  "email": "user@example.com",
  "password": "secure_password"
}'
```

### Upload File
```bash
BUCKET_NAME="avatars"
FILE_PATH="/path/to/image.jpg"
STORAGE_PATH="user-123/avatar.jpg"

curl -X POST \
  "${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${STORAGE_PATH}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -F "file=@${FILE_PATH}"
```

### Invoke Edge Function
```bash
source scripts/supabase-api.sh

supabase_post "/functions/v1/hello-world" '{
  "name": "Alice"
}'
```

## Architecture

### Shared Helper Script

`scripts/supabase-api.sh` provides common functions:

- `supabase_get(endpoint)` - GET requests
- `supabase_post(endpoint, json_data)` - POST requests
- `supabase_patch(endpoint, json_data)` - PATCH requests
- `supabase_delete(endpoint)` - DELETE requests
- `validate_env()` - Check environment variables
- `success(message)`, `error(message)`, `warning(message)` - Formatted output

All skills source this helper to avoid duplication.

### Skill Structure

Each skill is organized as:
```
skills/
└── supabase-{feature}/
    └── SKILL.md          # Skill documentation with examples
```

Skills are self-contained and can be used independently.

## Requirements

### Environment
- Bash 4.0+
- curl
- jq (recommended for JSON parsing)

### Optional Tools
- Supabase CLI (for edge functions deployment)
- websocat or wscat (for realtime WebSocket connections)
- Deno (for local edge function development)

### Install Optional Tools

**jq (JSON processor):**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq  # Debian/Ubuntu
sudo yum install jq      # RHEL/CentOS
```

**Supabase CLI:**
```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

**websocat (WebSocket client):**
```bash
# macOS
brew install websocat

# Linux
wget https://github.com/vi/websocat/releases/download/v1.12.0/websocat.x86_64-unknown-linux-musl
chmod +x websocat.x86_64-unknown-linux-musl
sudo mv websocat.x86_64-unknown-linux-musl /usr/local/bin/websocat
```

## Security

### API Keys

**Anon Key** (public):
- Use for client-side operations
- Respects Row Level Security (RLS) policies
- Safe to expose in client applications

**Service Role Key** (secret):
- Full admin access, bypasses RLS
- Use only for admin operations
- NEVER expose to clients or commit to git

### Best Practices

1. **Never commit credentials** - Use environment variables
2. **Enable Row Level Security** - Configure RLS policies in Supabase dashboard
3. **Use appropriate keys** - Anon for client ops, service role for admin only
4. **Validate input** - Sanitize user input in edge functions
5. **Set file size limits** - Configure storage bucket limits
6. **Implement rate limiting** - Protect public endpoints

## Troubleshooting

### Environment Variables Not Set
```
Error: SUPABASE_URL environment variable is not set
```
**Solution:** Export your environment variables (see Installation step 2)

### Authentication Errors
```
Error: HTTP 401
```
**Solution:** Check that your SUPABASE_KEY is valid and has necessary permissions

### File Upload Failures
```
Error: HTTP 413 Payload too large
```
**Solution:** Check bucket file size limits in Supabase dashboard

### Edge Function Timeout
```
Error: HTTP 504 Gateway timeout
```
**Solution:** Edge functions have 150s wall clock limit. Optimize function or break into smaller operations.

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [Supabase Auth API](https://supabase.com/docs/guides/auth)
- [Supabase Storage API](https://supabase.com/docs/guides/storage)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- [GitHub Issues](https://github.com/Nice-Wolf-Studio/claude-code-supabase-skills/issues)
- [Supabase Discord](https://discord.supabase.com/)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)

---

**Created for Claude Code** - Comprehensive Supabase API wrapper skills
