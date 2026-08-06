# Damtech Admin — authentication setup

This guide walks through creating a Supabase project and enabling Google OAuth **and** email/password sign-in for `/admin`.

Auth uses **Supabase Auth** (not Auth.js / NextAuth). Both providers share the same `admin_email_allowlist` gate.

## 1. Create a Supabase project

1. Sign up / sign in at [https://supabase.com](https://supabase.com).
2. Create a new project (choose a strong database password; store it in a password manager).
3. Wait until the project is healthy.

## 2. Apply SQL migrations

In the Supabase dashboard → **SQL Editor**, run the contents of:

1. `supabase/migrations/20260715120000_admin_auth_phase1.sql`
2. Then insert the first owner (do **not** commit the real email):

```sql
insert into public.admin_email_allowlist (
  email,
  assigned_role,
  is_active
)
values (
  'REPLACE_WITH_APPROVED_GOOGLE_EMAIL',
  'owner',
  true
);
```

Use lowercase for the email. The allowlist constraint requires `email = lower(email)`.

Optional (CLI):

```bash
npx supabase db push
```

## 3. Google Cloud OAuth credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. APIs & Services → **Credentials** → **Create credentials** → **OAuth client ID**.
4. Application type: **Web application**.
5. Authorised JavaScript origins:

```txt
http://localhost:3000
https://damtech-website-six.vercel.app
https://dam-tech.co.za
https://www.dam-tech.co.za
```

6. Authorised redirect URIs (Supabase callback — replace PROJECT_REF):

```txt
https://PROJECT_REF.supabase.co/auth/v1/callback
```

7. Copy the Client ID and Client Secret.

## 4. Enable Google in Supabase Auth

1. Supabase → **Authentication** → **Providers** → **Google**.
2. Enable Google.
3. Paste Client ID + Client Secret.
4. Save.

## 5. Enable email/password in Supabase Auth

1. Supabase → **Authentication** → **Providers** → **Email**.
2. Enable **Email**.
3. Prefer disabling public sign-ups if your Supabase plan/UI offers it — admins are created by an owner, not self-registered.
4. Create each allowlisted admin user:
   - **Authentication** → **Users** → **Add user** → email + password, or
   - Ask the user to use “Forgot password” only if you intentionally enable recovery emails.
5. Ensure the same address is on `admin_email_allowlist` (lowercase).

Password and Google can both be used for the same allowlisted email if that user exists in Auth with both methods linked (or only password / only Google).

## 6. Configure Supabase Auth URL settings

Authentication → **URL Configuration**:

**Site URL** (production):

```txt
https://www.dam-tech.co.za
```

**Redirect URLs** allow list:

```txt
http://localhost:3000/auth/callback
https://damtech-website-six.vercel.app/auth/callback
https://dam-tech.co.za/auth/callback
https://www.dam-tech.co.za/auth/callback
```

Only add Vercel preview wildcards if your security policy allows them.

## 7. Vercel environment variables

Project → Settings → Environment Variables. Set for Production (and Preview if needed):

| Name | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` — **server only** |
| `NEXT_PUBLIC_SITE_URL` | `https://www.dam-tech.co.za` |

Redeploy after saving.

## 8. Local development

```bash
cp .env.example .env.local
# fill in real values
npm run dev
```

Open `http://localhost:3000/admin/login/`.

## 9. First login

1. Sign in with email/password **or** Continue with Google using an allowlisted account.
2. Google flow: `/auth/callback` exchanges the code, then verifies the allowlist.
3. Password flow: server action `signInWithEmailPassword` verifies credentials, then the same allowlist provisioning.
4. Approved users land on `/admin/`. Unapproved sessions are signed out and denied.

## 10. Deactivate an admin

```sql
-- Disable allowlist entry (blocks future provisioning)
update public.admin_email_allowlist
set is_active = false
where email = 'user@example.com';

-- Disable profile (blocks active sessions on next requireAdmin check)
update public.admin_profiles
set is_active = false
where email = 'user@example.com';
```

Ask the user to sign out, or revoke sessions in Supabase → Authentication → Users.

## 11. Rotate the service-role key

1. Supabase → Project Settings → API → reset / rotate service role key.
2. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel and `.env.local`.
3. Redeploy.
4. Confirm public lead inserts and admin login still work.

## 12. Remove localhost before hardening production (optional)

When you no longer need local OAuth against production credentials:

1. Remove `http://localhost:3000` from Google authorised origins.
2. Remove localhost redirect URLs from Supabase Auth URL config.
3. Prefer a separate Supabase project for local/dev if possible.

## Roles

| Role | Intent |
|---|---|
| `owner` | Full access + allowlist/security |
| `admin` | Operational admin (not ownership changes) |
| `sales` | RFQs, customers, quotes, communications |
| `estimator` | RFQs, pricing reads, quote calculations |
| `viewer` | Read-only permitted records |
