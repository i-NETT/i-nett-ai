# i-nett.ai Session Handoff

Last updated: 2026-05-29 (after polish + expansion pass)

This file is the bridge between Claude Code sessions. Open the project in
Claude Code, paste the "Resume prompt" below as the first message, and the
next session has everything it needs to continue.

---

## 1. Current status

- **Live at** https://i-nett.ai (GitHub Pages, deploys on push to main).
- **31 pages** built and deployed. Astro static site, GitHub Actions workflow at `.github/workflows/deploy.yml`.
- **Latest commit** before this handoff: `b638b42` ("Purge remaining 'guarantee' instances per hardened rule").
- **Sessions to date:**
  1. Phase 3 scaffold (30 pages, schema, ROI calc, llms.txt, robots)
  2. Polish A-D (brand assets, premium polish, ROI variable slider, podcast page)
  3. Polish + expansion pass W1-W7 (NAP/favicon/contrast, /insurance-policy, trust signals, three-pillar modals, ROI redesign, team 2x2 grid, Digital Dilemma YouTube embed)

---

## 2. Resume prompt (paste this as first message next session)

```
I'm continuing work on i-nett.ai (the Fortify AI launch site).

Before doing anything else:
1. Read SESSION-HANDOFF.md at the project root for current status,
   outstanding placeholders, and known follow-ups.
2. Read i-nett-ai-build-spec-current.md for the locked spec.
3. Memory in C:\Users\Nick\.claude\projects\C--Users-Nick-Documents-i-nett-ai\memory\
   covers my role, copy voice rules, and project context — those load
   automatically.

Then tell me which of the outstanding placeholders in the handoff doc are
worth shipping first based on what we already have versus what I'd need to
provide, and wait for me to choose.
```

---

## 3. Outstanding placeholders (flagged in code with comments)

These will improve the live site once I supply the asset or decision.

### Assets I need to drop in

| Item | Path / location | Code comment pointer |
|---|---|---|
| John Lehmkuhl headshot | `public/assets/brand/john-lehmkuhl-headshot.jpg` (suggested) | `src/pages/index.astro` near `leader-card__placeholder` |
| Oscar Salazar headshot | `public/assets/brand/oscar-salazar-headshot.jpg` (suggested) | same file, second placeholder |
| Official Lloyd's of London logo | `public/assets/brand/lloyds-of-london.png` (suggested) | `src/pages/insurance-policy.astro` near `.lloyds-wordmark` |
| Official Digital Dilemma logo | `public/assets/brand/digital-dilemma.png` (suggested) | `src/pages/index.astro` near `.dd-logotype` |
| Per-episode YouTube URLs | swap into `featuredEpisodes` array | `src/pages/podcast.astro` top of frontmatter |
| Short-form clip URLs + thumbnails | swap `shorts` array entries | `src/pages/podcast.astro` |

### Decisions / external setup needed

| Item | Where | What to do |
|---|---|---|
| Google Search Console verification | `src/lib/site.ts` `verification.google` | Replace `REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TAG` with the real meta tag value |
| Bing Webmaster verification | `src/lib/site.ts` `verification.bing` | Replace `REPLACE_WITH_BING_WEBMASTER_TAG` |
| AI Readiness Scan integration | `src/pages/resources.astro` form handler | Hook real HubSpot form or Worker; current implementation stores locally |
| HermanScience efficacy figures | `src/pages/index.astro` Three Things section | After John Lehmkuhl review, add cited stats and remove the directional-language comment |
| Sitemap priorities | `astro.config.mjs` `serialize()` | Tune if specific pages should rank higher |

### Known follow-ups

| Item | Trigger date | What to do |
|---|---|---|
| Node 20 actions deprecation | Cutover June 16, 2026 (forced) / Sept 16, 2026 (removed) | Bump `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` in `.github/workflows/deploy.yml` to versions supporting Node 24 |
| Phase 4 post-render expert panel | After significant new content lands | Run the full expert panel against the original spec checklist |

---

## 4. Voice + compliance rules (hardened, hard guard)

These are enforced in memory and grepped before every commit. Re-state to
the next Claude Code session if it forgets.

- **Em dashes:** ZERO. Use commas, periods, colons, or restructure.
- **"Guarantee":** ZERO instances anywhere on i-nett.ai. For Lloyd's use "insurance policy" or "financially underwritten". For ROI disclaimers use "forecast" or "assurance of results".
- **Absolute claims:** No "100% compliant", "100% of the time", "nothing ever leaves the solution".
- **Vendor names:** Do not name "COVE" or "Cove" anywhere.
- **"I" in business copy:** Always "we". Personal bios are the only exception.
- **Specific HermanScience percentages (73%, 74%, 54%, 45%, etc.):** Banned until John Lehmkuhl reviews the source documentation.
- **Primary CTA pattern:** HubSpot booking link `https://meetings-na2.hubspot.com/ndreyfus/initial_call`. Never Calendly.

A quick guard pass before any commit:

```bash
grep -rn --include="*.astro" --include="*.ts" --include="*.css" '—' src/ public/
grep -rn -i --include="*.astro" --include="*.ts" --include="*.css" 'guarantee' src/ public/
grep -rn -i --include="*.astro" 'COVE\|Cove\|100% compliant\|nothing ever leaves' src/
```

All three should print nothing.

---

## 5. Key URLs

| Purpose | URL |
|---|---|
| Production site | https://i-nett.ai |
| GitHub repo | https://github.com/i-NETT/i-nett-ai |
| HubSpot booking (primary CTA) | https://meetings-na2.hubspot.com/ndreyfus/initial_call |
| Parent site | https://i-nett.com |
| Apple Podcasts (Digital Dilemma) | https://podcasts.apple.com/us/podcast/the-digital-dilemma/id1764658911 |
| YouTube uploads playlist | https://www.youtube.com/embed/videoseries?list=UUWcdscFXqBjRG838BAFGsUw |
| Nick LinkedIn | https://www.linkedin.com/in/nicholas-dreyfus/ |
| TikTok | https://www.tiktok.com/@nick.dreyfus.inett |
| Instagram | https://www.instagram.com/nick.dreyfus.inett/ |

---

## 6. NAP (already wired into schema everywhere)

```
i-NETT
9655 Granite Ridge Drive, Suite 200
San Diego, CA 92123
(805) 642-3558
hello@i-nett.com
```

Single source of truth: `src/lib/site.ts`.

---

## 7. Repo cheat sheet

```
i-nett-ai/
  .github/workflows/deploy.yml      # GitHub Actions -> Pages
  public/                           # Static assets (CNAME, favicons, llms.txt, robots.txt, brand)
  src/
    lib/site.ts                     # SINGLE SOURCE OF TRUTH: NAP, nav, presets, verification tags
    styles/global.css               # Design tokens, base reset, utilities, .btn variants
    components/                     # Header, Footer, SEO, SchemaOrg, FAQ, CTASection,
                                    #   Breadcrumbs, ROICalculator, ROIModal, DemoStream
    layouts/                        # BaseLayout (wraps SEO + schema), PageLayout (page header)
    pages/                          # Routes (file-based)
      index.astro                   # Cinematic homepage (largest file)
      fortify-ai.astro
      how-it-works.astro
      roi-calculator.astro
      insurance-policy.astro        # Added in polish pass
      industries/{healthcare,legal,financial-services,professional-services}.astro
      locations/
        southern-california.astro, los-angeles.astro, orange-county.astro, ventura.astro
        san-diego/
          index.astro (primary)
          {del-mar,carlsbad,oceanside,poway,la-mesa,chula-vista}.astro
      about.astro, case-studies.astro, blog.astro, resources.astro, podcast.astro, contact.astro
      privacy.astro, accessibility.astro, terms.astro, 404.astro
  astro.config.mjs                  # Sitemap config, output: 'static'
  package.json                      # Scripts: dev, build, preview
  i-nett-ai-build-spec-current.md   # Locked spec from the original master prompt
  SESSION-HANDOFF.md                # This file
```

---

## 8. How to dev locally

```bash
npm install
npm run dev        # localhost:4321
npm run build      # outputs to dist/
```

---

## 9. Pushing changes

```bash
git push origin main
```

Triggers `.github/workflows/deploy.yml`. Build ~40s, deploy ~10s.

If push fails with a permissions error, the auth is wrong. Make sure
you're logged in as the i-NETT-org account (`nickdreyfus-inett`), not
your personal AITS account.

Watch the run:

```bash
gh run list --branch main --limit 1
gh run watch <RUN_ID> --exit-status
```
