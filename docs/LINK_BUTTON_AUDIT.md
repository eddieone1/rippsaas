# Link & Button Audit Report

**Date:** March 9, 2025  
**Scope:** Entire codebase – links, buttons, and interactive elements

---

## Summary

| Category | Status |
|----------|--------|
| Broken links (`href="#"`) | **2 issues** |
| Non-functional buttons | **1 (intentional)** |
| Invalid/missing routes | None found |
| Settings hash anchors | All valid ✓ |

---

## 1. Broken Links (href="#")

### 1.1 InsightsPageClient – AtRiskList & CampaignTable

**Location:** `components/insights/InsightsPageClient.tsx`

- **Line 188:** `<AtRiskList members={...} />` – no `seeAllHref` passed  
- **Line 341:** `<CampaignTable campaigns={...} />` – no `viewAllHref` passed  

**Root cause:** `AtRiskList` and `CampaignTable` default to `seeAllHref="#"` and `viewAllHref="#"` when not provided.

**Effect:** "See all" and "View all plays" links do nothing useful (scroll to top).

**Note:** `InsightsPageClient` is not currently used by the app; the insights page uses `InsightsDashboard`. These broken links only appear if `InsightsPageClient` is ever rendered.

**Suggested fix:** Pass proper hrefs:
- `AtRiskList`: `seeAllHref="/members/at-risk"`
- `CampaignTable`: `viewAllHref="/plays"`

---

## 2. Non-Functional Buttons (Intentional)

### 2.1 FeatureMockup – Decorative Buttons

**Location:** `components/landing/FeatureMockup.tsx` (lines 204, 207)

Two buttons in the "insights" mockup: "Engagement" and "Churn". They have no `onClick` handler.

**Status:** Intentional – part of a static UI mockup for the landing page.

---

## 3. Verified Working

### Routes

All referenced routes exist:

- `/`, `/login`, `/signup`, `/join`, `/pricing`, `/support`, `/privacy`, `/terms`
- `/dashboard`, `/members`, `/members/at-risk`, `/members/upload`, `/members/[id]`
- `/plays`, `/plays/new`, `/plays/[id]`
- `/insights`, `/approvals`, `/logs`, `/settings`, `/roi`
- `/coach-accountability`, `/coach/inbox`, `/coach/playbook`
- `/integrations`, `/onboarding/*`, `/forgot-password`, `/reset-password`, `/verify-email`, `/trial-expired`

### Settings Hash Anchors

`SettingsNav` uses `#branding`, `#communications`, etc. All IDs exist in `SettingsContent.tsx`:

- branding, communications, auto-interventions, memberships, members, studio, staff, subscription, personal, gym-profile

### Landing Page #features

`/#features` links to `FeatureRow` section with `id="features"`.

---

## 4. UX Considerations (Not Broken)

### Integrations Page – "Contact us"

**Location:** `app/(marketing)/integrations/page.tsx` (line 150)

Text: "Need a different integration? **Contact us** to discuss custom integration options."  
Link target: `/signup`

**Note:** "Contact us" often suggests a support/contact form. A `/support` link might better match user expectations, though linking to signup may be intentional for conversion.

---

## 5. Component Defaults to Fix

To avoid future broken links, consider changing defaults in:

| Component | File | Current default | Suggested default |
|-----------|------|-----------------|-------------------|
| AtRiskList | `components/insights/AtRiskList.tsx` | `seeAllHref="#"` | `seeAllHref="/members/at-risk"` |
| CampaignTable | `components/insights/CampaignTable.tsx` | `viewAllHref="#"` | `viewAllHref="/plays"` |

---

## 6. Form Submit Buttons

All form submit buttons have appropriate `type="submit"` and `disabled` handling. No issues found.
