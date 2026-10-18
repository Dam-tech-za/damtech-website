# DAMTECH — CLAUDE CODE MASTER MISSION

**Owner directive | 18 October 2026 | Status: execute, verify, and complete**  
**Company:** Damtech Structural Solutions  
**Production website:** https://www.dam-tech.co.za/  
**Project:** Damtech Website — independent takeover of three Cowork workstreams  
**Development environment:** local Windows desktop Git repository, GitHub, Vercel, Next.js/TypeScript and Supabase (verify actual versions, connections, and configuration).

> **READ THIS FIRST:** This is an **execution brief**, not evidence that previous work was approved. Inspect the repository and live site independently. Implement and verify the work rather than stopping after recommendations. Respect environment limits and permissions. Do not claim tests, deployments, uninterrupted execution, or model switches that did not occur.

## 0. Mission and desired result

You are the accountable lead engineer, creative director, UX/UI designer, technical SEO specialist, performance engineer, QA lead, and application-security reviewer for Damtech's website. Three initiatives have already been started in Claude Cowork:

1. **Entire website:** genuine premium frontend transformation, complete site audit, technical SEO preservation/optimisation, accessibility, speed, reliability, and lead conversion.
2. **Residential waterproofing:** credible service and geographically relevant landing pages, particularly Pretoria/Centurion and the Overstrand/Overberg; working residential quotation flow.
3. **Admin panel:** full usability and functional reconstruction, reliable navigation, real data, correct backend integration, and tested customer/lead workflows.

**Take these projects over independently.** Existing Cowork changes and reports are material to inspect, not design decisions to follow uncritically. Keep good code; replace weak implementations; preserve functioning systems. The result must feel like a *new premium website*, not the old one with serif fonts and slightly changed blue backgrounds.

Business: Damtech supplies and installs HDPE/PVC dam linings, corrugated steel water reservoirs and related systems, torch-on bitumen waterproofing, repairs, and agricultural/industrial/commercial/residential waterproofing. Agricultural and industrial opportunities may be nationwide when commercially viable; residential focus is Pretoria and surrounding Tshwane/Centurion, and the Overstrand/Overberg (Betty's Bay, Kleinmond, Pringle Bay, Rooi-Els, Hermanus, Gansbaai and nearby genuinely served places). **Overstrand is not a Cape Town suburb.** Verify service areas and offerings before stating them publicly.

Commercial priority: **qualified enquiries and profitable projects**, not page counts or vanity traffic. Reported existing traffic is about 800–900 visitors/month; verify analytics rather than presenting this as an independently measured baseline.

## 1. Initial takeover: protect all existing work

Before writing code:

1. Read `CLAUDE.md`, relevant `.claude/` rules, repository documentation, previous Cowork notes, brand documents, existing tests, and recent commit history. Their claims are *unverified until checked*.
2. Inspect `git status`, current branch, remotes, tracked/untracked changes, local commits, remote branches, and Vercel's deployed revision. Identify Cowork work on branches, current local code, and live production. Do not assume they are identical.
3. If work is uncommitted, **preserve it** safely before any destructive Git operation. Do not silently discard, force-push, reset, overwrite, or rebase away another agent's work.
4. Create a recoverable development branch/checkpoint (e.g. `claude-code/damtech-completion`) after identifying a suitable baseline. Keep production intact while working.
5. Inventory actual page routes (previously estimated at 73–74, but recent changes may alter this), page templates, existing image assets, forms, calculators, admin pages, database access, background jobs, tracking integrations and deployment process.
6. Record a factual baseline: URLs, content and SEO metadata, available conversion data, before screenshots, mobile/desktop Lighthouse lab measurements, critical user flows, and existing failures.
7. Read any supplied Grok website benchmark report and the owner's screenshots as references; if unavailable in the local environment, note their absence rather than pretending to have viewed them.

Create/update `docs/development/claude-code-master-mission.md` with a **live task ledger**: each workstream, discovered problems, action, tests, commit, preview, status, next steps, and blockers. Mark Cowork work *unverified*, *verified useful*, *reworked*, or *rejected*, with reasons.

**Avoid concurrent edits:** the Cowork sessions should no longer modify the same branch/files. Work independently in a dedicated branch or isolated worktree.

## 2. Model selection, switching and subagents — IMPORTANT

**Use the most capable available model for the reasoning-intensive work while delegating suitable routine tasks efficiently.** Availability depends on account, provider and installed Claude Code version. Detect what's supported; never silently incur extra usage-credit charges or fabricate a model switch.

### Practical selection policy

| Work | Preferred model | Why |
|---|---|---|
| Independent takeover strategy, architecture, brand creative direction, complex debugging, security and final critical reviews | **Opus** (or the most capable authorised model offered in the environment) | Highest reasoning value and difficult trade-offs |
| Implementing Next.js components, redesigning page templates, ordinary refactoring, unit/integration tests, fixing routine defects | **Sonnet** | Strong general coding and execution throughput |
| Mechanical searches, repetitive low-risk formatting, route inventory helpers, straightforward documentation indexing | **Haiku**, where supported | Efficient focused subtasks |
| Large independent quality/security reviews | **Opus subagent** if available | Fresh critique of implementation rather than rubber-stamping |

**Recommended session setting:** `opusplan` when supported. This uses Opus in **plan mode** and Sonnet for **execution mode**. It is **not** a promise of arbitrary automatic model selection for every individual operation.

Claude Code CLI commands (use in the **CLI**, not as words inside ordinary project text):

```text
/model
/model opusplan
/model opus
/model sonnet
/model haiku
```

- `/model` opens the model picker. In Claude Code **Desktop**, the model can also be changed using the model selector beside the prompt field.
- For a CLI session starting in the recommended mode, use `claude --model opusplan` if supported.
- If `opusplan` is unavailable, use Opus for initial planning and explicit Sonnet execution sessions, with handoffs recorded in the mission ledger. If only one model is available, use it; do not block the project.
- Main-session model switching **may require an actual session/UI command**. A sentence in a Markdown file does not itself switch the model. Where switching is not programmatically exposed, continue with the available model or provide concise, exact instructions to the owner.
- If available, configure *custom subagents* with model assignments rather than expecting the main model to change silently. Use Opus for independent security/architecture review, Sonnet for coding and tests, Haiku for simple read-only audit workers.
- Subagents must have well-defined outputs and avoid overlapping edits. Use isolated worktrees/branches where appropriate; only the lead agent integrates results after tests.
- Do not launch excessive subagents solely to consume capacity. Minimise overlapping work and conflicting Git operations.
- If a newer premium model (e.g. a model presented as `best` or `fable`) is available, consider it for exceptionally complex, long-running investigations **only within the account's authorised budget and without unattended paid-credit consent**. Opus/Sonnet/Haiku remain the safe default allocation.

**Model-aware operating loop:** Opus plans or reviews the work → Sonnet implements and tests → independent Opus review identifies weaknesses → Sonnet or Opus corrects based on complexity → final verified checks. Use this pattern where model/tool access actually permits it; otherwise perform the same stages with the available model.

Official Claude Code references (consult current documentation if commands differ):
- https://code.claude.com/docs/en/model-config
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/desktop
- https://code.claude.com/docs/en/memory

## 3. Priority A — radically better visual design (NOT a typography-only refresh)

### Creative benchmark

**Primary:** https://www.swellroofing.com/ — bold colour, strong editorial design, real crews/projects, confident typographic scale, unusual yet purposeful composition, tasteful motion, visible proof and clear conversion actions.

**Secondary:** https://www.promax.co.nz/ — authentic water-tank installations, agricultural/industrial sector tiles, strong product/category visualisation, large photographic scale, technical credibility.

**Selective:** https://pomerleau.ca/en — bold numerical sections, dark/contrasting panels, architectural projects/case-study layouts.

The owner **particularly loves Swell Roofing**. Study the actual live desktop and mobile experience, not just its colour swatches and headings. Do not copy logos, text, photos, code or distinctive copyrighted assets. Produce an original Damtech identity with a comparable level of visual quality.

### Diagnose the last failed approach

Previous screenshots show:
- Dark navy gradient behind a standard left-aligned text hero, with the project photograph largely hidden.
- Conventional small header, buttons and feature-card clusters.
- Mobile hero dominated by a dark colour block, little visible photography, crowded buttons, competing sticky bottom actions.
- Residential waterproofing page resembling a plain documentation page: simple dark banner and large flat text sections.

**These are unacceptable as the final design.** A new font, slightly altered blue, and ordinary cards do not constitute a visual rebuild.

### Creative permissions — broad

You may fundamentally redesign **visual architecture**: hero composition, section positions and visual order, spacing, photography framing (CSS only), navigation appearance/interaction, typography, content layout, cards, grids, dark/light colour blocking, conversion areas, galleries, responsive layout and purposeful motion.

Preserve Damtech's recognisable **blue family**, but explore deep navy, strong vivid blue, water-cyan/turquoise, warm cream/off-white and charcoal, with deliberate contrast. Do not make every section a blue gradient. Explore an editorial serif/sans pairing **or** a superior confident sans pairing; select by visual results, not habit. Create durable tokens and reusable components; avoid repetitive generic SaaS-style cards.

**Hero:** Consider full-bleed authentic dam/lining photography with powerful headline, a prominent Damtech identity and clear CTAs; test genuinely different compositions, select the strongest and implement it. Existing H1 *wording* must remain unchanged, but line breaks, span styling and positioning can change. Mobile must be independently composed—don't merely shrink the desktop layout.

**Below the hero:** Intentionally differentiate credibility/proof, service sectors, product and service discovery, company story, technical information, featured projects, process, regions and enquiry sections. Use genuine project imagery and verified project scope. Do not invent ratings, project counts, years of experience, certifications, logos or claims. Avoid pages with the same hero followed by identical white cards.

**Service families:**
- Dam lining: powerful landscape photography and engineering competence.
- Steel reservoirs: Promax-like product presentation with dimensions/capacity/specifications and legitimate product pricing.
- Residential waterproofing: premium homeowner/contractor experience with relevant proof, simple enquiry actions and real installation imagery when available.
- Projects: architectural editorial case studies with real project photographs, locations and verified scope.
- Technical articles/calculators: clear, attractive, high-readability presentation; preserve calculations and content.

**Motion:** Allow high-quality CSS motion and lightweight interaction (entrances, hover feedback, comparison sliders where authentic matching images exist, gallery transitions, selective scroll-triggered reveals), but no autoplay heavy hero video, scroll-jacking, obtrusive parallax or motion that hides text from crawlers. Honour `prefers-reduced-motion` and avoid delaying user input.

### Image prohibition — maintain without compromising layout

**Do not modify, regenerate, retouch, replace, delete or permanently crop any existing source image file.** Do not imply another company's photo is Damtech work. You may change frontend framing, CSS object positioning, responsive presentation and surrounding composition; delivery optimisation is acceptable if originals are preserved. Audit available images for quality and fitness.

For missing/poor imagery, create `docs/branding/damtech-photography-requirements.md` with page/section, purpose, scene, crew/PPE/tools where appropriate, aerial vs ground camera, lighting, framing, mobile safe area, aspect ratio, minimum resolution, recommended name, alt text, priority and why a current image fails. Use strong interim layout solutions without falsifying evidence.

### Visual acceptance bar

Every major page **must look substantially different** in composition, brand expression, image prominence and mobile UX compared with the old screenshot. Compare old/new screenshots side by side at desktop and mobile. If the difference is mainly typography, **redo it**.

## 4. SEO/content preservation rules — distinguish appearance from meaning

This is **not a wholesale copy rewrite or SEO migration**. Protect current organic search assets, even while fundamentally changing visual layout.

**Preserve by default:**
- Existing URL slugs and public routes, canonical tags, robots directives, sitemap inclusion and redirects.
- SEO title and meta descriptions; structured-data facts; Open Graph text; internal-link destinations.
- H1–H6 **wording**, hierarchy and semantic intent; substantive paragraphs, project specifications, FAQs, product descriptions, prices, quantities, warranties and established SEO copy.
- Publicly accessible, crawlable content on mobile and desktop; navigation paths; existing valid enquiry links.

You may rearrange the *presentation* and visual groupings; maintain coherent accessible DOM reading order and semantic structure. Do not arbitrarily hide important paragraphs behind JavaScript-driven reveals or omit them on mobile. Keep existing internal links operable. New content may be created as a **separate approved expansion** for residential waterproofing; do not rewrite legacy high-value pages just to fill a new design.

Before changing templates, snapshot route-level **text/headings/metadata/canonicals/structured data/internal links/indexability**. After changes, automatically diff against baseline; explain and reverse accidental differences. Fix demonstrable technical errors only with evidence and an appropriately scoped change, not silent speculative SEO edits. Rankings are not guaranteed unchanged even if text remains identical; monitor Google Search Console where authorised.

## 5. Priority B — residential waterproofing growth

Independently inspect what Cowork already built. Verify technical accuracy, keyword intent, actual location coverage, usability and working enquiry flow. Retain useful URLs/content and improve weak pages; **do not create duplicative location doorway pages**.

**Target regions:** Pretoria, Pretoria East, Centurion, nearby Tshwane suburbs, Betty's Bay, Kleinmond, Pringle Bay, Rooi-Els, Hermanus, Gansbaai and genuinely served Overstrand/Overberg communities. Avoid invented branches or street addresses.

**Service concepts to validate and present correctly:** roof and flat slab waterproofing; torch-on modified-bitumen membranes; foundation and below-grade/retaining-wall waterproofing; damp-proofing and rising-damp diagnosis; roof leak repairs; suitable liquid-applied rubberised and reinforced systems, coatings and compatible paint systems. Different substrates and hydrostatic conditions require different systems; do not promise one system works everywhere. Do not advertise unverified capabilities.

Evaluate a coherent page architecture (not a mandatory count): residential hub, roof waterproofing, foundations/damp, several distinct regional pages, and useful method/material guides. Search demand, real service capability and existing pages determine final routes. Separate residential enquiry journeys from agricultural quoting complexity, but keep the established backend and source of truth. Ensure service classification, location and lead attribution reach the admin workflow.

**The residential pages must feel closer to Swell's premium contractor presentation than to a plain technical manual**, while retaining accurate, substantive content and avoiding stock project claims.

## 6. Priority C — admin panel reconstruction

Independently inspect **source code and authorised live/staging admin UI**. Test by clicking through, not by reading JSX alone. If authentication is unavailable, do not bypass it; use legitimate test sessions and record what cannot be verified.

Create a focused, minimal admin interface with real, useful functionality:
- Overview: real enquiries awaiting action, meaningful business/website status, real connection and error states.
- Enquiries: list/search/filter/open, service type (residential vs lining vs tanks), customer contact, location, request details, attachment access where authorised, clear follow-up workflow when supported.
- Quotations and related workflows: respect existing external systems and avoid duplicate CRM/accounting sources of truth.
- Products, projects, content and analytics: only implement useful functions backed by genuine data and business needs.
- Settings/system health: clear permissions, integrations, validation and actionable error messages.

Every clickable control must work or be removed. No decorative fake dashboard data, dead links, silent saves or misleading success toasts. Verify authentication, access permissions/RLS, server-side validation, Supabase operations, query performance and stored lead data. Use nonproduction fixtures for mutation tests. **Never delete production leads, reset Supabase or run destructive migrations without explicit approval and recovery safeguards.**

Admin visual style should be **much calmer and more utilitarian** than the public Swell-inspired site. Optimise speed to task, clarity and predictable state transitions, not flashy animations.

## 7. Priority D — comprehensive technical audit, SEO and performance

Discover all routes, then audit **every public route and all distinct templates**, with automated coverage and targeted human-like browser checks. Inspect:

- HTTP status, crawlability, headings, metadata, canonical, sitemap, robots, JSON-LD, links and duplicate content.
- English spelling, claims, engineering specifications, capacities and calculations. **Do not silently rewrite protected text; report proposed editorial changes** except genuine safe corrections expressly authorised in a dedicated content task.
- Responsive behaviour, contrast, focus, keyboard navigation, motion preferences, overflow, form accessibility.
- Data collection and consent, lead attribution, server validation, spam resistance, error recovery, integrations.
- Vercel/Next.js performance, bundle size, fonts, client components, caching, Supabase availability, scheduled jobs and product feeds.

### Grok benchmark: preliminary, not verified field evidence

User-supplied Grok report (17 October 2026) reports median desktop Lighthouse scores: **Swell 100, Promax 96.5, Pomerleau 90.5, Damtech 65**. Damtech had **LCP about 2.66 s, TBT around 389 ms**, and approximately **407 KiB of flagged unused JS**; potential duplicate GA4/GTM loading and Meta Pixel execution were noted. These were simulated desktop lab tests from US-east infrastructure, **not mobile results or South African real-user CrUX measurements**. Re-measure and confirm before changing tracking. Do not assume every flagged byte is removable or every Google tag is duplicate tracking.

**Targets (engineering goals, not absolute guarantees):** desktop Lighthouse 90+, mobile 85+ in repeatable lab conditions; p75 **LCP ≤2.5s, INP ≤200ms, CLS ≤0.1** where field data is available; no important journey regressions. Prioritise actual customer responsiveness over a perfect lab score. Never disable legitimate marketing attribution simply to inflate Lighthouse.

## 8. End-to-end testing and quality gates

Create a testing matrix and execute it, rather than asserting quality:

**Public routes:** representative page families plus systematic route checks; desktop and mobile full-page screenshots at **390×844, 768×1024, 1366×768, 1440×900**, with additional narrow viewport checks. Validate layout, overflow, navigation menus, anchors, real photos, CTA links, SEO text and interactive states.

**Forms and calculators:** validate inputs, correct maths, safe error handling, Supabase/backend persistence, notifications where configured, source attribution and no unintended production test leads.

**Admin:** authenticated page routes, filters, searches, safe CRUD with fixtures, persistence, permission boundaries, clear error states and useful navigation.

**Automated:** discover existing package commands; run TypeScript, lint, unit/integration, Playwright/E2E as practical, production build, dependency/security checks, SEO snapshot diffs and Lighthouse multiple runs on preview and selected production URLs.

**Independent critique:** separate passes for design, technical SEO, performance, functionality, security and business effectiveness. An Opus review subagent should challenge implementation where available. Correct defects, repeat testing and verify regression-free results.

**Definition of done:** meaningful implementation complete, critical/high issues resolved, verified tests and browser checks, SEO protected, major workflows functional, visual change unmistakable, and deployment status accurately reported. If blocked, label the specific unresolved item; do not pretend it is finished.

## 9. Working order and deployment safety

The mission is a multi-stage programme, not three disconnected cosmetic exercises:

1. **Discovery and baseline:** repository/branch/Cowork comparison, routes, analytics if available, performance, SEO, screenshots and risk.
2. **Brand and design system:** choose a genuinely original high-impact direction; implement tokens/components/fonts without forcing legacy compositions.
3. **Flagship visual rebuild:** desktop and mobile homepage, then residential roof page; inspect screenshots critically; redo if too similar to the old design.
4. **Public page family rollout:** all major service, reservoir/product, regional, project, calculators and informational templates; preserve copy/SEO.
5. **Residential expansion:** complete meaningful local/service content, links and relevant conversion integration, avoiding duplicate pages.
6. **Admin reconstruction:** verify and repair real workflow end to end, including newly created residential leads.
7. **Technical quality pass:** all public routes, SEO snapshots, performance, accessibility, security, test suite.
8. **Preview → release:** use logical commits and Vercel preview deployments. Deploy to production **only when enabled by the user's permissions and after relevant acceptance tests**; verify the actual Vercel production deployment, relevant pages and leads. Roll back critical regressions safely.
9. **Final audit:** produce before/after visual comparisons and an evidence-based results report with remaining owner dependencies.

**Auto-execution policy:** take routine decisions independently. No approval needed for normal code edits, CSS, internal refactors, planned tests or non-destructive documentation. Do not stop to ask whether the owner prefers slightly heavier serif fonts or different shades of blue. **Do require appropriate approval** for destructive migrations, irreversible data changes, credential/security policy changes, unapproved commercial content, paid services or additional charge consent, and any deployment permissions not already granted. Avoid unreviewed deletion of Cowork work or production assets.

**Execution limits:** continue autonomously within the environment's actual capabilities. Session/model/token limits are real. On interruption, commit/checkpoint safe work and write exact restart steps; do not promise an agent can work indefinitely after the runtime has stopped.

## 10. Required deliverables and evidence

Create or update these version-controlled reports (reuse equivalent existing files if they are correctly maintained):

| Document | Required contents |
|---|---|
| `docs/development/claude-code-master-mission.md` | Persistent ledger: scope, evidence, stages, statuses, blockers, commits, next exact actions |
| `docs/design/cowork-takeover-audit.md` | Independent evaluation of previous Cowork work; retain/replace rationale |
| `docs/design/current-website-audit.md` | Complete route/template audit; current deficiencies and resolution status |
| `docs/branding/damtech-brand-guidelines.md` | Original brand direction, colours/HEX/tokens, licensed font choices, examples, component and motion rules |
| `docs/branding/damtech-photography-requirements.md` | Existing asset inventory, retain/reframe/replace assessment, detailed shot list and priority |
| `docs/design/visual-transformation-results.md` | Files/components/routes redesigned, screenshots, comparison with old and Swell principles, test results |
| `docs/seo/seo-preservation-diff.md` | Before/after URL, headings, text, metadata, schema, linking and indexing regression results |
| `docs/seo/residential-waterproofing-plan.md` | Search intent, truthful coverage, differentiated service/local architecture, actual implementation |
| `docs/admin/admin-audit-and-verification.md` | Authenticated flows tested, usability problems fixed, data/security verification, residual blockers |
| `docs/performance/benchmark-comparison.md` | Fresh mobile/desktop measurements, repeatability, source of data, scripts, Core Web Vitals qualifications |
| `docs/development/release-verification.md` | Git commits, preview and production deployments, checks, rollback status, unresolved items |
| `docs/branding/owner-action-items.md` | Only real owner dependencies, especially authentic new photos and genuinely unverified business facts |

**Final response to owner:** concise executive summary with **implemented / verified / deployed / blocked**, key screenshots and benchmarks, exact Git commit/release identification, what's left, and only genuine owner inputs. Never confuse a passed build with a deployed, tested site.

## 11. Persistent project guidance without bloating the context

This Markdown file is the **master execution mission**. It is not a demand to dump all of it into every future chat. Maintain a concise root `CLAUDE.md` (ideally <200 lines) containing the enduring non-negotiable rules: brand character and Swell inspiration, protect SEO/copy, never modify original image assets, real data only, non-destructive safeguards, relevant test commands, and a reference to this mission ledger. Put detailed results and photography guidance under `docs/`.

If an existing `CLAUDE.md` conflicts with the owner's updated creative instruction, **reconcile it** rather than layering contradictory rules: preserve established SEO/copy, **but do not preserve the old visual layout**. Do not weaken data/privacy/security constraints.

After major checkpoints, keep repository state and mission ledger current so a newly started Claude Code session can continue from verified progress without inheriting an unsupported “all done” claim.

---

## START NOW — precise first actions

1. Confirm the actual repository, local branch and connection to GitHub/Vercel; preserve any uncommitted Cowork changes.
2. Inventory what Cowork implemented and independently compare with the live website and the owner's screenshots.
3. Inspect the three benchmark websites; critically explain why the current redesign is not Swell-quality.
4. Establish SEO/content and performance baselines, then implement a **genuinely different homepage and roofing-page composition** as the flagship design test.
5. Browser-review both at mobile and desktop; revise until unmistakably premium and distinct, without changing SEO text or source photographs.
6. Continue into the remaining templates, residential offering, admin panel and all-route verification. Do not stop at a new plan or after one pretty page.
7. Maintain a recoverable, well-tested Git history, an accurate mission ledger and verifiable results.

**Success is not that Claude spent many hours working. Success is a substantially better, original, fast, trustworthy Damtech website—with existing SEO protected, credible residential waterproofing pages, and a genuinely working admin panel.**
