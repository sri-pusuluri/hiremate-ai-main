# HireSort AI — Client Careers "Plug & Play" Architecture Reference

> **Document Version:** 1.0  
> **Last Updated:** September 2026  
> **Topic:** Strategies to eliminate dual-codebase maintenance between the HireSort ATS portal and client websites (e.g., Zool website).

---

## 1. Executive Summary & Context

Currently, active jobs and candidate counts are displayed in two distinct locations:
1. **HireSort ATS Portal (`hiremate-ai-main`):** The hosted candidate-facing portal (`/careers/:clientSlug` and `/jobs/:jobId`).
2. **Client Website (`zool-website-git`):** A custom React component (`HireSortJobs.tsx`) manually placed inside the client's codebase connecting directly to Supabase.

### The Problem with Dual Maintenance
* **Code Duplication:** Whenever a badge (e.g., applicant count, "early applicant" badge, question bank, or expiration logic) is added or modified, code must be updated and deployed in **both** repositories.
* **Schema Drift & Version Mismatch:** If Supabase schemas or column names change, client sites break until updated manually.
* **Non-React Client Limitations:** Clients running WordPress, Webflow, Shopify, Framer, PHP, or Next.js cannot directly copy-paste a standalone Vite/React TypeScript component without adaptation.

---

## 2. Comparison Matrix

| Option | Maintenance Location | Framework Agnostic? | Implementation Effort | Client Integration Complexity | Styling Isolation | Real-time Updates |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Hosted Responsive Iframe** | 100% ATS Portal | ✅ Yes (Any website) | 🟢 Very Low (1–2 hrs) | 🟢 1 snippet | 🛡️ Perfect (Iframe) | ✅ Instant |
| **2. Embed Script Tag (Widget)** | 100% ATS Portal | ✅ Yes (Any website) | 🟡 Moderate (3–4 hrs) | 🟢 1 `<script>` tag | 🛡️ Perfect (Shadow/Iframe) | ✅ Instant |
| **3. Web Component (Custom Element)** | 100% ATS Portal | ✅ Yes (HTML5 native) | 🟡 Moderate | 🟢 Custom HTML tag | 🛡️ Shadow DOM | ✅ Instant |
| **4. Published NPM Package** | NPM + Client app | ❌ React only | 🟠 Medium | 🟡 `npm install` + updates | ⚠️ Can clash with CSS | ⚠️ Requires `npm update` |
| **5. Headless REST / Supabase API** | Client handles UI | ✅ Yes (Any frontend) | 🔴 High for Client | 🔴 Full custom build | 🎨 100% Client native | ✅ Instant |

---

## 3. Detailed Architectural Options

### Option 1: Hosted Responsive Iframe (`/embed/careers/:clientSlug`) ⭐ *(Recommended)*

#### How It Works
HireSort serves a clean, self-contained, chromeless route (no header navigation, no ATS footer, transparent background) designed specifically for embedding:
`https://app.hiresort.ai/embed/careers/{clientSlug}?theme=dark`

Any client (React, Next.js, Webflow, WordPress, etc.) embeds it with a single standard HTML snippet.

#### Client-Side Integration Code
```html
<!-- Client simply pastes this into any page -->
<iframe 
  src="https://app.hiresort.ai/embed/careers/zool?theme=dark" 
  width="100%" 
  height="700px" 
  style="border: none; overflow: hidden; border-radius: 16px;" 
  title="Careers at Zool"
  loading="lazy"
></iframe>
```

Or in a React component (`Careers.tsx`):
```tsx
export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Join Our Team</h1>
      <iframe 
        src="http://localhost:8080/embed/careers/zool?theme=dark" 
        className="w-full min-h-[750px] border-0 rounded-2xl"
        title="Careers at Zool"
      />
    </div>
  );
}
```

#### Pros
- **Zero Client Maintenance:** Every time HireSort updates badges, applicant counts, filtering, or application forms, client websites receive updates automatically without touching client code.
- **Cross-Platform:** Works on React, Vue, Angular, WordPress, Wix, Webflow, plain HTML.
- **Style Isolation:** Client CSS never breaks HireSort UI, and HireSort CSS never breaks client website styling.
- **Fastest Time to Market:** Requires only 1 new route (`/embed/careers/:clientSlug`) in HireSort ATS reusing the existing `PublicCareers.tsx` logic without the top navbar.

#### Cons
- Dynamic iframe auto-resizing (height matching job card count) requires `postMessage` or `iframe-resizer` script so the iframe doesn't show scrollbars.

---

### Option 2: 1-Line Embed Script Tag (`widget.js`)

#### How It Works
This is how modern enterprise platforms like **Stripe Elements**, **Calendly**, **Intercom**, and **Ashby** operate. HireSort provides a hosted JavaScript bundle that automatically mounts an iframe or Shadow DOM container into a placeholder `<div>`.

#### Client-Side Integration Code
```html
<!-- Client places container where jobs should appear -->
<div id="hiresort-careers" data-client="zool" data-theme="dark"></div>

<!-- Client includes 1-line script (can be in <head> or footer) -->
<script src="https://cdn.hiresort.ai/widget.js" async></script>
```

#### How `widget.js` Works Internally (on HireSort CDN)
```javascript
(function() {
  const container = document.getElementById('hiresort-careers');
  if (!container) return;

  const client = container.getAttribute('data-client') || 'default';
  const theme = container.getAttribute('data-theme') || 'dark';

  const iframe = document.createElement('iframe');
  iframe.src = `https://app.hiresort.ai/embed/careers/${client}?theme=${theme}`;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';

  // Listen for dynamic height messages from HireSort
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'HIRESORT_RESIZE') {
      iframe.style.height = e.data.height + 'px';
    }
  });

  container.appendChild(iframe);
})();
```

#### Pros
- **Premium Client Experience:** Cleanest integration possible for non-technical or marketing teams.
- **Automatic Dynamic Resizing:** Script handles iframe height expansion automatically so no double scrollbars ever appear.
- **Universal:** Works on 100% of websites.

#### Cons
- Requires hosting and maintaining `widget.js` on HireSort CDN/public folder.

---

### Option 3: Web Component with Shadow DOM (`<hiresort-jobs>`)

#### How It Works
Leverages the browser-native W3C Web Components standard (`customElements.define('hiresort-jobs', ...)`). The component fetches jobs from the ATS/Supabase and renders them inside an isolated Shadow DOM.

#### Client-Side Integration Code
```html
<script type="module" src="https://cdn.hiresort.ai/hiresort-jobs.js"></script>

<hiresort-jobs 
  client="zool" 
  theme="dark" 
  show-search="true"
></hiresort-jobs>
```

#### Pros
- Feels like a native HTML tag.
- Shadow DOM protects styling from the host page.
- Direct DOM integration (no iframe barriers).

#### Cons
- Font rendering and custom themes can be tricky to penetrate into Shadow DOM without CSS variables.
- Requires building and bundling a standalone Web Component bundle.

---

### Option 4: NPM Component Package (`@hiresort/react`)

#### How It Works
HireSort packages the React UI components into an open-source or private NPM package (`@hiresort/react`).

#### Client-Side Integration Code
```bash
npm install @hiresort/react
```
```tsx
import { HireSortCareers } from '@hiresort/react';
import '@hiresort/react/dist/index.css';

export default function Careers() {
  return (
    <HireSortCareers 
      clientSlug="zool" 
      theme="dark" 
      onApply={(job) => console.log('Candidate applied:', job)}
    />
  );
}
```

#### Pros
- First-class developer experience for React and Next.js teams.
- Type safety and full TypeScript autocomplete for props.
- React event callbacks (e.g. `onApply`, `onFilterChange`).

#### Cons
- **Not truly 0-maintenance:** Clients still have to run `npm update @hiresort/react` whenever HireSort releases new features.
- React-only: Excludes clients using other web stacks.

---

### Option 5: Headless REST / Supabase API + Client Custom UI

#### How It Works
HireSort exposes a public API endpoint:
`GET https://app.hiresort.ai/api/v1/jobs?clientSlug=zool`

The client writes their own UI and templates, handling styling and rendering entirely within their own design system.

#### Pros
- Pixel-perfect consistency with client's existing design system.
- Zero iframe or third-party script styling constraints.

#### Cons
- Maximum client development effort.
- Every new feature (question bank, badges, live count, application drawer) must be custom coded by the client team.

---

## 4. Architectural Recommendation & Implementation Plan

### Recommended Hybrid Strategy: "Hosted Embed + Script Auto-Resizer"

To eliminate dual maintenance immediately while providing a seamless client experience:

### Step 1: Create the Embed Route in `hiremate-ai-main`
Add a lightweight route in `src/App.tsx`:
```tsx
<Route path="/embed/careers/:clientSlug" element={<EmbedCareersView />} />
```
* Uses the exact same state & database queries as `PublicCareers.tsx`.
* Strips out the top navbar, platform footer, and breadcrumbs.
* Emits window height via `window.parent.postMessage({ type: 'HIRESORT_RESIZE', height: document.body.scrollHeight }, '*')` on job list updates.

### Step 2: In Client Sites (e.g. `zool-website-git`)
Replace the bulky 300-line `HireSortJobs.tsx` file with a clean 20-line embed wrapper:
```tsx
import React, { useEffect, useRef } from 'react';

export interface HireSortJobsProps {
  clientSlug?: string;
  theme?: 'dark' | 'light';
}

export const HireSortJobs: React.FC<HireSortJobsProps> = ({
  clientSlug = 'zool',
  theme = 'dark'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'HIRESORT_RESIZE' && iframeRef.current) {
        iframeRef.current.style.height = `${e.data.height}px`;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={`http://localhost:8080/embed/careers/${clientSlug}?theme=${theme}`}
      className="w-full border-0 transition-all duration-300"
      style={{ minHeight: '600px' }}
      title="Careers Portal"
    />
  );
};
```

### Benefit of this approach:
1. **Single Source of Truth:** All changes (candidate counts, early applicant badges, application forms, expiry filters, question banks) happen inside `hiremate-ai-main`.
2. **Instant Sync:** Zool website and future client websites automatically reflect every ATS update with zero future commits in client repos.
