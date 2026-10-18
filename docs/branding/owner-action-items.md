# Owner action items

Only things that need you; everything else is in progress on the branch.

1. **Review the preview** of branch `claude/project-thread-mfiulx`: open it from the Vercel status on the latest commit in GitHub (needs your Vercel login). Production is unchanged until you approve a merge.
2. **Residential photography** — the biggest remaining gap. See `docs/branding/damtech-photography-requirements.md` (8-shot list; #1 flat-roof torch-on, #2 parapet before/after, #4 Overstrand context are most valuable). Include town, date and client consent.
3. **Admin test access** — a test admin login or a `.env.local` pointing at a Supabase branch, so the admin can be clicked through and a test residential enquiry run end to end without touching production leads.
4. **Approve database security fixes** — revoke anonymous access to 14 `SECURITY DEFINER` functions and pin `set_updated_at` search_path (details in `docs/admin/admin-audit-and-verification.md`). I'll draft the migration; it needs your go-ahead to apply.
5. **Enable leaked-password protection** in Supabase → Authentication settings.
6. **Google Tag Manager container review** (whoever manages marketing tags): GTM + Meta Pixel are ~720 KB of JavaScript and ~450 ms of main-thread time on mobile. Removing unused tags there is the largest speed win and needs no code change.
7. **Business facts still unverified** (unchanged from Cowork's list): "30+ years combined team experience" wording, fish-pond kit dimensions, Tulbagh tank capacity/size, and please confirm the Overstrand town list the Overstrand page names (Betty's Bay, Kleinmond, Pringle Bay, Rooi-Els, Hermanus, Onrus, Vermont, Gansbaai, Stanford, De Kelders) is all genuinely served.
