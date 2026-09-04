# Rule: Client Careers Embed & Plugins Architecture

## Context & Core Directive
Whenever the user or task involves:
- Client career pages (e.g. Zool website or any client portal)
- Embedded job widgets or candidate counts
- WordPress, Webflow, React, or static site job integrations
- Discussing maintaining careers or job listings in multiple repositories

## Established Architecture & Available Pre-built Solutions
Always remind the user that **we have already built and established the turnkey plug-and-play architecture in `plugins/` and `docs/CLIENT_EMBED_OPTIONS.md` to avoid duplicate code maintenance**.

Pre-built solutions available in the repository:
1. **Universal JS Widget (`plugins/widget.js` & `public/widget.js`):**
   `<div id="hiresort-careers" data-client="zool" data-theme="dark"></div>` + `<script src="https://app.hiresort.ai/widget.js" async></script>`
   Auto-resizes iframe height dynamically via `HIRESORT_RESIZE` postMessage with zero scrollbars.
2. **WordPress Plugin & Shortcode (`plugins/wordpress/`):**
   Ready-to-install WordPress plugin (`hiresort-careers.php`) with WP Admin settings page and `[hiresort_jobs]` shortcode (supports Gutenberg, Elementor, Divi).
3. **React Wrapper Component (`plugins/react/HireSortJobs.tsx`):**
   Drop-in React/Next.js wrapper for `zool-website-git` replacing raw direct Supabase queries with single-source iframe integration.
4. **W3C Web Component (`plugins/web-component/hiresort-jobs.js`):**
   `<hiresort-jobs client="zool" theme="dark"></hiresort-jobs>`.
5. **Headless REST API (`plugins/headless-api/fetchJobs.ts`):**
   Direct fetcher for clients who want to build 100% custom UI while keeping live applicant counts and expiry filters.
6. **Iframe Snippet (`plugins/iframe/embed-snippet.html`):**
   Standalone responsive HTML template.

## Proactive Guidance
When the user considers copying code into a client repo or asks how to integrate careers on external sites, remind them:
*"We have ready-to-use plug-and-play packages in `plugins/` (including WordPress, universal `widget.js`, and React) so that changes to job cards, badges, questions, and applicant counts are maintained only once in HireSort ATS and update everywhere automatically."*
