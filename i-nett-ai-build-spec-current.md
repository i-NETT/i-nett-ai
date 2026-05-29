# i-nett.ai Full Build Specification (Current State)
## Updated May 29, 2026 (after Polish Pass)

This document is the authoritative reference for everything on i-nett.ai. Save it. Reference it for future Claude Code sessions. Update it when major changes ship.

---

## 1. OWNERSHIP AND INFRASTRUCTURE

**Domain:** i-nett.ai (registered to i-NETT operating entity via GoDaddy)
**GitHub:** github.com/i-NETT/i-nett-ai (free Org tier, owned by i-NETT GitHub Organization)
**Hosting:** GitHub Pages (free tier) via GitHub Actions deploy workflow
**DNS:** Four A records to GitHub Pages IPs (185.199.108-111.153) + CNAME `www` → `i-nett.github.io`
**SSL:** GitHub-issued Let's Encrypt certificate, Enforce HTTPS enabled
**Framework:** Astro static site generator (latest version)
**Local development:** `C:\Users\Nick\Documents\i-nett-ai`
**Maintenance model:** Self-maintained by Nick + John via Claude Code

---

## 2. BRAND IDENTITY

**Product brand:** Fortify AI (productized brand with own visual identity)
**Parent brand:** i-NETT (corner branding throughout)
**Lockup:** "i-NETT FORTIFY AI" wordmark with shield logo mark

**Brand assets (located in repo):**
- `public/assets/brand/fortify-ai-logo.png` — Full lockup, transparent (908x630)
- `public/assets/brand/fortify-ai-logo-mark.png` — Shield only, transparent square (368x368)
- `public/assets/brand/inett-logo.png` — i-NETT parent logo (blue cloud)
- `public/assets/brand/nick-headshot.jpg` — Nick Dreyfus headshot
- `public/assets/brand/dale-stein-headshot.jpg` — Dale Stein headshot
- `public/assets/brand/chamber-ambassador-2025.png` — East County Chamber Ambassador 2025 badge (Nick's bio only)
- `public/assets/brand/hipaa-compliant.png` — HIPAA compliance badge
- `public/assets/brand/iso-27001.png` — ISO 27001 alignment badge
- `public/assets/brand/tag-coverage-map.png` — TAG Network coverage map

**Brand assets pending (placeholders in code with comments):**
- John Lehmkuhl headshot (use initials placeholder until Nick provides)
- Oscar Salazar headshot (use initials placeholder until Nick provides)
- Lloyd's of London official logo (use typographic treatment until Nick provides)
- Digital Dilemma podcast logo (use typographic treatment with microphone icon until Nick provides)

**Favicon and social card assets (located in repo public root):**
- `public/favicon-32x32.png`
- `public/favicon-16x16.png`
- `public/favicon.svg`
- `public/apple-touch-icon.png` (180x180)
- `public/og-image.png` (1200x630, Open Graph social sharing card)

**Tagline:** "Make every employee an AI expert. Securely."

**Typography:** Inter (body), General Sans or Söhne (headings), JetBrains Mono (code)
**Colors:** i-NETT deep blue (primary), electric cyan (Fortify AI accent), full neutral gray scale, white default, dark theme for cinematic sections

---

## 3. PRIMARY BUSINESS CONTEXT

**Operating entity:** i-NETT (i-NETT operating entity, San Diego, founded 1982)
**Address:** 9655 Granite Ridge Drive, Suite 200, San Diego, CA 92123
**Phone:** (805) 642-3558
**Email:** service@i-nett.com
**Service hours:** M-F 8:00am - 5:00pm PST

**Primary persona:** Mid-market CEO or Owner at 30-150 employee firm in healthcare, legal, financial services, or professional services.

**Goal stack (ranked):**
1. Brand authority (B-led when forced to choose)
2. Lead generation (A, close second)
3. Content distribution (C)

**CTA hierarchy:**
- Primary: Take the free AI Readiness Scan
- Secondary: Book a 30-minute Fortify AI consultation (HubSpot: https://meetings-na2.hubspot.com/ndreyfus/initial_call)
- Tertiary: Download Fortify AI capability brief OR subscribe to The Digital Dilemma

**Differentiators (three pillars):**
1. Completely secure AI (dedicated tenant, no shared training, configured to regulatory environment)
2. Automations built for your team (done-for-you, not self-serve tooling)
3. Full-time prompt coach (behavioral science guidance, hours back per employee per week, powered by HermanScience methodology)

---

## 4. SITE ARCHITECTURE

```
/                                        Cinematic homepage (single-page scroll)
/fortify-ai                              Product detail
/how-it-works                            Methodology and deployment
/roi-calculator                          Full ROI calculator with methodology
/insurance-policy                        Lloyd's of London insurance policy detail (NEW)

/industries/healthcare
/industries/legal
/industries/financial-services
/industries/professional-services

/coverage                                National + Canadian footprint via TAG
/locations/southern-california           Regional hub
/locations/ventura
/locations/los-angeles
/locations/orange-county
/locations/san-diego                     Primary (most weight)
/locations/san-diego/del-mar
/locations/san-diego/carlsbad
/locations/san-diego/oceanside
/locations/san-diego/poway
/locations/san-diego/la-mesa
/locations/san-diego/chula-vista

/about                                   i-NETT positioning + leadership team (2x2 grid)
/case-studies                            Hub (post-launch content)
/case-studies/[slug]                     Individual cases (post-launch)
/blog                                    Hub (post-launch content)
/blog/[slug]                             Individual articles (post-launch)
/resources                               Whitepapers, AI Readiness Scan link
/podcast                                 The Digital Dilemma full archive
/contact                                 Direct contact + HubSpot booking

/privacy                                 CCPA + GDPR + PIPEDA unified
/accessibility                           ADA accommodation statement
/terms                                   Terms of Use
/404                                     Branded 404
```

Total: 30+ unique URLs at launch.

---

## 5. HOMEPAGE STRUCTURE (Cinematic Single-Page Scroll)

**Section 1: Hero**
- Lloyd's of London badge pill (clickable, links to /insurance-policy)
- Headline: "Managed AI, built for the firms regulators trust."
- Subhead: "Make every employee an AI expert. Securely."
- Description: "Fortify AI deploys secure, compliance-ready AI infrastructure into healthcare, legal, financial services, and professional services firms across Southern California, the United States, and Canada. We operate it. You see results."
- Primary CTA: "Take the AI Readiness Scan"
- Secondary CTA: "Book a 30-minute consultation" (white opacity background style)
- Fortify AI logo as cinematic centerpiece (right side of hero)
- "Live Deployment" card with rotating ROI preview number

**Section 2: Trust Signals Row**
"Trusted by mid-market firms across the regulated industries"
- HIPAA Compliant
- ISO 27001 aligned
- Lloyd's of London Cybersecurity insurance policy (financially underwritten)
- TAG Network (148 service cities, US & Canada)

(Chamber Ambassador 2025 moved to Nick's bio in team section, NOT on company trust row.)

**Section 3: What We Do (Three Pillar Cards, Clickable)**
"Three things, done at the standard your industry actually requires."

Each card is clickable, opens full-screen modal with expanded copy and business outcomes.

Card 01: Compliance-first Infrastructure
Card 02: Targeted, High-Leverage Workflows
Card 03: Managed Operations

**Section 4: ROI Calculator Trigger (Two-Column Layout)**
- LEFT column (60%): "Your Number" eyebrow, "What is a five-hour-per-week productivity uplift worth to your firm?" headline, body copy, primary CTA "Calculate Your Savings"
- RIGHT column (40%): Visual icon/preview of calculator
- Click opens in-page modal with full calculator
- Modal has link "See full methodology page" → /roi-calculator

**Section 5: Built by Operators (2x2 Team Grid)**
Top-left: Dale Stein, CEO & Partner
Top-right: Nick Dreyfus, VP Business Development (with Chamber Ambassador 2025 badge)
Bottom-left: John Lehmkuhl, VP Operations
Bottom-right: Oscar Salazar, Telecom Services Manager

Each card: headshot, name, title, 2-3 paragraph bio, social links row.

**Section 6: From the Podcast**
- "FROM THE PODCAST" eyebrow
- "The Digital Dilemma" H2
- Description
- Digital Dilemma logo (placeholder until official asset)
- Responsive YouTube embed (uploads playlist UUWcdscFXqBjRG838BAFGsUw, 16:9, max 960px, centered)
- Three CTAs: "Listen on Apple Podcasts" (primary), "Book a 30-min consultation" (secondary, white opacity bg), "Visit i-nett.com" (tertiary)

**Section 7: Final CTA**
Primary HubSpot booking link with closing copy.

---

## 6. ROI CALCULATOR SPECIFICATION

**Inputs (three sliders + one dropdown):**

Industry preset dropdown (auto-fills Sliders 1 and 2):
| Industry | Default Employees | Default Hourly Cost |
|----------|-------------------|---------------------|
| Healthcare | 150 | $52 |
| Legal | 75 | $95 |
| Financial Services | 100 | $68 |
| Professional Services | 50 | $72 |
| Real Estate | 80 | $48 |
| Manufacturing | 200 | $42 |
| Construction | 60 | $55 |
| Nonprofit / Education | 100 | $38 |
| Hospitality / Retail | 250 | $32 |

Slider 1: Employee count (with variable step sizes)
- 1 to 150: step 1
- 150 to 500: step 50
- 500 to 1,000: step 50
- 1,000 to 50,000: step 250
- Number input field next to slider for direct typing

Slider 2: Per-hour loaded cost ($25 to $200, step 1)

Slider 3: Hours saved per week per employee (1 to 15, step 1, default 5)

**Calculation:** Employees × Hourly × Hours/week × 50 working weeks = Annual potential value

**Display:**
- GIANT annual savings number (largest visual)
- Monthly savings (secondary)
- Industry context line
- "See full methodology" link → /roi-calculator
- "Book consultation" CTA → HubSpot

**Disclaimer (every instance):**
"Estimated savings based on assumed inputs and industry productivity research. Actual results vary by industry, deployment, and execution. This calculator is for illustrative purposes only and is not a guarantee of results. Wage data sourced from U.S. Bureau of Labor Statistics Occupational Employment Statistics. Productivity assumptions sourced from recent studies on generative AI impact in knowledge work."

**Deployment (two places):**
1. Homepage in-page modal (triggered from Section 4 CTA)
2. Dedicated `/roi-calculator` page with full methodology, BLS source citation, industry-specific notes, case study cross-links

---

## 7. LEADERSHIP TEAM BIOS

### Dale Stein, CEO & Partner
LinkedIn: https://www.linkedin.com/in/steindale/

"Dale leads i-NETT and co-founded Technology Assurance Group (TAG), a network of leading Managed Technology Services Providers representing over $1 billion in combined annual products and services across North America. His strategic vision guides both organizations.

Prior to i-NETT, Dale served as CEO of INET, Inc., growing it into the #1 distributor of Mitel products in North America. He founded Westec Security Corporation and built it to more than $30 million in annual revenues. Dale holds a Bachelor's degree from DeVry and completed Harvard's Small Company Management Program. He serves on the Chairmen's Roundtable in San Diego."

### Nick Dreyfus, Vice President of Business Development
Badge: East County Chamber of Commerce Ambassador of the Year 2025
LinkedIn: https://www.linkedin.com/in/nicholas-dreyfus/
HubSpot booking: https://meetings-na2.hubspot.com/ndreyfus/initial_call
The Digital Dilemma podcast: https://podcasts.apple.com/us/podcast/the-digital-dilemma/id1764658911
TikTok: https://www.tiktok.com/@nick.dreyfus.inett
Instagram: https://www.instagram.com/nick.dreyfus.inett/

"Nick brings over 12 years as a systems administrator plus a decade of consulting and network architecture experience to his role. He focuses on understanding each client's unique culture and operational needs before developing customized technology strategies in managed services, cloud, AI, and cybersecurity.

Nick hosts The Digital Dilemma podcast, where he interviews founders, technologists, and CEOs on the operational realities of running a modern business. He was named East County Chamber of Commerce Ambassador of the Year for 2025. He holds a Bachelor of Science in Network Engineering from Coleman University."

### John Lehmkuhl, Vice President of Operations
LinkedIn: https://www.linkedin.com/in/john-lehmkuhl/
Headshot: PENDING (placeholder with initials "JL" until Nick provides)

"John brings over 20 years of IT management experience to his role overseeing i-NETT's day-to-day operations, technical engineers, and 24/7/365 multi-state service group. His technical skill set spans Microsoft Azure, Amazon Web Services, network security, virtualization, and database management, with high-level coding in multiple languages.

John mentors the technical team through certifications and ongoing training. He has worked with nearly all verticals and a vast array of software and hardware platforms. He actively participates in TAG initiatives, industry conferences, and technology partner ecosystems."

### Oscar Salazar, Telecom Services Manager
LinkedIn: https://www.linkedin.com/in/oscar-salazar-94488311/
Headshot: PENDING (placeholder with initials "OS" until Nick provides)

"Oscar brings over four decades of progressive experience in telecommunications and IT industries. Since joining i-NETT in 2003, he has held multiple concurrent roles, currently serving as Telecom Services Manager where he oversees a broad range of technical and managerial responsibilities.

With expert-level knowledge in converged communication systems, Oscar manages both in-house and field engineering teams, spearheading project development from initial design through successful deployment. He has developed and implemented comprehensive policies and procedures that optimize operations and improve service delivery."

---

## 8. STANDING COPY RULES (CRITICAL, NEVER VIOLATE)

**Banned terms anywhere on i-nett.ai:**
- "Guarantee" / "guaranteed" in connection with Lloyd's, security, or compliance
- "100% compliant" / "100% of the time" / any absolute claim
- "Nothing ever leaves the solution"
- "COVE" or "Cove" as vendor partner name
- Em dashes (use commas, periods, restructure)
- "I" in business copy (always "we")

**Substitution rules:**
- "guarantee" → "insurance policy" or "financially underwritten" or "underwritten"
- Specific efficacy percentages (73%, 74%, 54%, 45%) → directional language ("dramatically reduces," "measurably improves") until HermanScience source documentation is on file and John Lehmkuhl reviews

**Required phrasings:**
- Lloyd's positioning: "Underwritten by Lloyd's of London cybersecurity insurance policy"
- Data privacy: "Customer data is isolated to your dedicated tenant. We do not use customer data for model training or share it across clients."
- Compliance: "Built for HIPAA, GDPR, SOC, and CCPA compliance. Deployments are configured to your regulatory environment and reviewed by your compliance team."

**Required link patterns:**
- HubSpot booking: https://meetings-na2.hubspot.com/ndreyfus/initial_call (primary CTA throughout)
- Calendly: never use, retired
- Digital Dilemma references must include the three-link trio: HubSpot booking, https://i-nett.com, https://podcasts.apple.com/us/podcast/the-digital-dilemma/id1764658911

---

## 9. INTEGRATIONS (CURRENT STATE)

**Active:**
- HubSpot booking link as primary CTA throughout
- Schema.org JSON-LD on every page (Organization, LocalBusiness, Service, FAQPage, WebApplication, Article, BreadcrumbList, Person, PodcastSeries)
- llms.txt at root for AEO
- robots.txt with AI scraper allowlist (GPTBot, ClaudeBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot)
- Auto-generated XML sitemap
- Open Graph and Twitter Card meta tags with og-image.png
- YouTube embed for latest Digital Dilemma episode (uploads playlist UUWcdscFXqBjRG838BAFGsUw)

**Placeholder (post-launch wiring):**
- HubSpot form for AI Readiness Scan (currently localStorage, needs real HubSpot form ID)
- Google Search Console verification meta tag (needs real verification code from GSC)
- Bing Webmaster Tools verification meta tag (needs real verification code from Bing Webmaster)
- Analytics (GA4 or Plausible, not yet wired)

**Future (post-launch additions):**
- Error monitoring (Sentry free tier)
- Real-time AI demo (currently scripted typewriter, could connect to actual API later)
- Newsletter signup integration

---

## 10. LEGAL AND COMPLIANCE STATUS

**Compliance scope:** WCAG 2.2 AA + CCPA + GDPR + PIPEDA + HIPAA-adjacent disclaimers + financial services disclaimers

**Pages with required disclaimers:**
- Healthcare industry page: "informational only, not medical or compliance advice"
- Financial services industry page: "informational only, not financial or regulatory advice"
- ROI calculator (modal and dedicated page): "forward-looking, illustrative only, not a guarantee of results"

**Legal review queue for John Lehmkuhl:**
1. /insurance-policy page copy (Lloyd's positioning final approval)
2. ROI calculator disclaimer language
3. Privacy policy (CCPA + GDPR + PIPEDA unified)
4. Healthcare and financial services disclaimers
5. Fortify AI trademark search and USPTO filing under i-NETT operating entity
6. Synthreo/HermanScience reseller agreement review (confirm permitted claims and attribution)
7. Source code ownership confirmation for any future inherited assets
8. Substantiation documentation for HermanScience efficacy figures (request from Steve Doolittle and William Reed)

**Trust signal sources (all verifiable):**
- HIPAA Compliant (HIPAATraining.com badge)
- ISO 27001 aligned (via TAG)
- Lloyd's of London cybersecurity insurance policy (i-NETT corporate)
- TAG Network membership (148 service cities US and Canada)

---

## 11. AEO AND SEO TARGETING

**Hybrid layered strategy with San Diego primary:**

Homepage keywords: Fortify AI, managed AI San Diego, AI for businesses Southern California, enterprise AI San Diego

Industry pages: AI for healthcare practices San Diego, AI for law firms San Diego, HIPAA-compliant AI San Diego, AI for financial services Orange County, etc.

Location pages: AI consulting [city], AI implementation [city]

Compliance pillars: HIPAA, GDPR, SOC, CCPA, PIPEDA each get content presence

Engine-tilt mapping (one URL serves all engines, structure varies by topic):
- Perplexity/Claude tilt: primary-research-heavy, citation-dense, original data
- ChatGPT/Bing tilt: current-events, list format, year-stamped, schema-heavy
- Gemini/Google tilt: EEAT-loaded, evergreen, author-bio-prominent

**Performance targets (verified on every build):**
- LCP under 2.5s
- INP under 200ms
- CLS under 0.1
- Lighthouse 90+ across all four categories
- WCAG 2.2 AA compliant

---

## 12. CRITICAL OPEN ITEMS

**Verify with Nick or John before next major change:**
- Phone number (805) 642-3558 confirmed correct
- Address 9655 Granite Ridge Drive, Suite 200, San Diego, CA 92123 confirmed correct
- East County Chamber Ambassador award year (2025 per badge, 2026 per Nick's most recent message — currently displayed as 2025)
- Fortify AI trademark filing status
- HermanScience efficacy figure substantiation (currently using directional language, awaiting source documentation)

**Pending brand assets:**
- John Lehmkuhl headshot
- Oscar Salazar headshot
- Lloyd's of London official logo
- Digital Dilemma podcast logo

---

## 13. MAINTENANCE PATTERN

**Routine edits:** Nick or John runs Claude Code in `C:\Users\Nick\Documents\i-nett-ai`, describes the change, Claude Code edits and pushes. GitHub Actions auto-deploys within 5 minutes.

**Estimated time costs:**
- Small copy edits: 5-15 minutes
- New blog article: 30-60 minutes
- New industry page: 1-2 hours
- New location page: 30-60 minutes
- Major feature additions: 2-4 hours

**Authentication state:** GitHub authentication on Nick's machine is `nickdreyfus-inett` (i-NETT account). AITS account is logged out. Local Git config: `nickd@i-nett.com`, `Nick Dreyfus`. Entity separation verified.

**Branch model:** All commits go directly to `main`. GitHub Pages serves `main`. No staging environment.

---

## END OF SPEC

This document supersedes all previous build specs for i-nett.ai. Last updated: May 29, 2026 after the Polish Pass workstream.
