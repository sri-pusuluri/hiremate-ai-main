# HireSort AI — Embed Plugins & Integration Kits

This folder contains ready-to-use plugins and embed adapters that allow any client website to display HireSort career listings with live applicant counters and application forms.

---

## 📁 Folder Structure

```
plugins/
├── widget.js                    # 1-line Vanilla JS embed script (Calendly/Stripe style)
├── README.md                    # Quick start documentation (this file)
├── wordpress/                   # Installable WordPress Plugin (.zip)
│   ├── hiresort-careers.php     # Main WP plugin file with settings & shortcode [hiresort_jobs]
│   └── readme.txt               # WP plugin repository metadata
├── react/                       # Drop-in React & Next.js component
│   └── HireSortJobs.tsx         # Auto-resizing iframe wrapper with TypeScript support
└── web-component/               # Standard W3C custom element
    └── hiresort-jobs.js         # <hiresort-jobs client="zool" theme="dark"></hiresort-jobs>
```

---

## 1. Universal JavaScript Widget (`widget.js`)

**Best for:** Any website, HTML landing pages, Webflow, Squarespace, Wix, Framer.

### Usage
Place this where you want the job board to render:

```html
<!-- Container element -->
<div 
  id="hiresort-careers" 
  data-client="zool" 
  data-theme="dark"
  data-ats-url="https://app.hiresort.ai"
></div>

<!-- Turnkey Script -->
<script src="https://app.hiresort.ai/widget.js" async></script>
```

---

## 2. WordPress Plugin (`plugins/wordpress/`)

**Best for:** WordPress blogs, corporate sites, Elementor, and WooCommerce.

### Features
* Admin settings screen under **Settings > HireSort Careers**.
* Configure company slug (`zool`), default theme (`dark` / `light`), and ATS host URL.
* Use shortcode `[hiresort_jobs]` in any post, page, or widget.
* Override slug or theme per page: `[hiresort_jobs client="zool" theme="light"]`.

### Installation
1. Zip the `wordpress/` folder as `hiresort-careers.zip`.
2. In WordPress Admin, navigate to **Plugins > Add New > Upload Plugin**.
3. Activate the plugin and configure under **Settings > HireSort Careers**.

---

## 3. React / Next.js Component (`plugins/react/HireSortJobs.tsx`)

**Best for:** Client web apps built with React 18+, Vite, or Next.js (such as `zool-website-git`).

### Usage
Copy `HireSortJobs.tsx` into your client project:

```tsx
import { HireSortJobs } from './HireSortJobs';

export default function CareersPage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Open Roles</h1>
      <HireSortJobs clientSlug="zool" theme="dark" />
    </div>
  );
}
```

---

## 4. Web Component (`plugins/web-component/hiresort-jobs.js`)

**Best for:** HTML5 native integration with Shadow DOM.

### Usage
```html
<script type="module" src="https://app.hiresort.ai/plugins/web-component/hiresort-jobs.js"></script>

<hiresort-jobs 
  client="zool" 
  theme="dark"
></hiresort-jobs>
```
