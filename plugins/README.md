# HireSort AI — Embed Plugins & Integration Kits

This directory contains pre-built, production-ready integration packages and widgets allowing any external website or CMS (React, Next.js, WordPress, Webflow, Squarespace, HTML) to display HireSort career listings with live applicant counts, screening questions, and application drawers.

---

## 📊 Comparison Summary Table

| Option | Integration Method | Target Platforms | Maintenance Overhead | Style Isolation | Setup Time | Best Used For |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Option 1: Responsive Iframe** 🏆 | `<iframe src="/embed/careers/:slug">` | Any website, HTML, Webflow, WordPress | **Zero** (100% in ATS) | 🛡️ Perfect (Iframe sandbox) | 🟢 1 min | Fastest drop-in for any static or CMS site |
| **Option 2: Universal `widget.js`** 🏆 | `<script src=".../widget.js">` | Any CMS, WordPress, Webflow, Squarespace | **Zero** (100% in ATS) | 🛡️ Perfect (Auto-resizing iframe) | 🟢 1 min | **Intercom/Calendly-style turnkey embed** |
| **Option 3: Web Component** | `<hiresort-jobs client="zool">` | Native HTML5 / Modern SPAs | Low | 🛡️ Shadow DOM | 🟡 5 mins | Modern web standards without iframe tags |
| **Option 4: React Component** | `<HireSortJobs clientSlug="zool" />` | React 18+, Next.js, Vite | Low | 🛡️ Safe sandbox wrapper | 🟢 2 mins | **Drop-in replacement for `zool-website-git`** |
| **Option 5: Headless API** | `fetchHireSortJobs({ clientSlug })` | Any custom frontend | 🔴 High (Client builds UI) | 🎨 100% Client Native CSS | 🔴 1–2 days | Enterprise teams needing full design custom UI |
| **Option 6: WordPress Plugin** | `[hiresort_jobs client="zool"]` | WordPress 5.0+ / Elementor / Divi | **Zero** (100% in ATS) | 🛡️ Perfect | 🟢 3 mins | Non-technical WordPress site administrators |

---

## 📁 Directory Structure & Available Files

```
plugins/
├── README.md                      # Comprehensive comparison & usage guide (this file)
├── widget.js                      # Option 2: 1-line Universal script tag (also in public/widget.js)
├── iframe/
│   └── embed-snippet.html         # Option 1: Standalone responsive iframe template with auto-resizer
├── react/
│   ├── HireSortJobs.tsx           # Option 4: Drop-in React/Next.js component wrapper
│   └── package.json               # Package metadata for @hiresort/react
├── web-component/
│   └── hiresort-jobs.js           # Option 3: W3C Custom Element (<hiresort-jobs>)
├── headless-api/
│   └── fetchJobs.ts               # Option 5: Supabase / REST client fetcher with live applicant counts
└── wordpress/
    ├── hiresort-careers.php       # Option 6: WordPress plugin with Admin Settings & [hiresort_jobs]
    └── readme.txt                 # WordPress plugin directory readme
```

---

## 🚀 Usage Guide for Each Option

### 1. Universal JavaScript Widget (`widget.js`) — *Recommended for All Sites*
**Path:** [`plugins/widget.js`](./widget.js) / [`public/widget.js`](../public/widget.js)

```html
<!-- 1. Place container where jobs should appear -->
<div 
  id="hiresort-careers" 
  data-client="zool" 
  data-theme="dark"
  data-ats-url="https://app.hiresort.ai"
></div>

<!-- 2. Include the turnkey script -->
<script src="https://app.hiresort.ai/widget.js" async></script>
```
* **How it works:** Automatically mounts an iframe pointing to `/embed/careers/:clientSlug` and listens for `HIRESORT_RESIZE` postMessages so height scales dynamically with zero scrollbars.

---

### 2. Standalone Responsive Iframe Embed
**Path:** [`plugins/iframe/embed-snippet.html`](./iframe/embed-snippet.html)

```html
<div style="width: 100%; max-width: 1100px; margin: 0 auto;">
  <iframe 
    id="hiresort-iframe"
    src="https://app.hiresort.ai/embed/careers/zool?theme=dark" 
    width="100%" 
    height="650px" 
    style="border: none; border-radius: 12px; overflow: hidden; display: block;" 
    title="Careers at Zool"
    loading="lazy"
  ></iframe>
</div>

<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'HIRESORT_RESIZE' && e.data.height > 100) {
      document.getElementById('hiresort-iframe').style.height = e.data.height + 'px';
    }
  });
</script>
```

---

### 3. React / Next.js Component Wrapper
**Path:** [`plugins/react/HireSortJobs.tsx`](./react/HireSortJobs.tsx)

Ideal for replacing direct Supabase queries in client apps like `zool-website-git`:

```tsx
import { HireSortJobs } from './HireSortJobs';

export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Open Opportunities</h1>
      <HireSortJobs clientSlug="zool" theme="dark" />
    </div>
  );
}
```

---

### 4. Official WordPress Plugin
**Path:** [`plugins/wordpress/hiresort-careers.php`](./wordpress/hiresort-careers.php)

1. Compress the `plugins/wordpress/` folder into `hiresort-careers.zip`.
2. Go to **WordPress Admin > Plugins > Add New > Upload Plugin**.
3. Activate the plugin.
4. Go to **Settings > HireSort Careers** to configure your company slug and theme.
5. In any page, post, or Elementor widget, type:
   ```text
   [hiresort_jobs]
   ```
   Or override parameters:
   ```text
   [hiresort_jobs client="zool" theme="light" height="750px"]
   ```

---

### 5. Web Component (`<hiresort-jobs>`)
**Path:** [`plugins/web-component/hiresort-jobs.js`](./web-component/hiresort-jobs.js)

```html
<script type="module" src="https://app.hiresort.ai/plugins/web-component/hiresort-jobs.js"></script>

<hiresort-jobs client="zool" theme="dark"></hiresort-jobs>
```

---

### 6. Headless API Data Fetcher
**Path:** [`plugins/headless-api/fetchJobs.ts`](./headless-api/fetchJobs.ts)

For engineering teams that demand 100% custom UI control:

```ts
import { fetchHireSortJobs } from './fetchJobs';

const jobs = await fetchHireSortJobs({
  clientSlug: 'zool',
  includeApplicantCounts: true
});

console.log(jobs);
// Returns active, non-expired jobs with computed `candidateCount`
```
