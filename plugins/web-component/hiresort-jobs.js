/**
 * HireSort AI — Custom Web Component (<hiresort-jobs>)
 * Version: 1.0.0
 * 
 * Usage:
 *   <script type="module" src="https://app.hiresort.ai/plugins/web-component/hiresort-jobs.js"></script>
 *   <hiresort-jobs client="zool" theme="dark"></hiresort-jobs>
 */

class HireSortJobsElement extends HTMLElement {
  static get observedAttributes() {
    return ['client', 'theme', 'ats-url'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.iframe = document.createElement('iframe');
    this.onResizeMessage = this.onResizeMessage.bind(this);
  }

  connectedCallback() {
    this.render();
    window.addEventListener('message', this.onResizeMessage);
  }

  disconnectedCallback() {
    window.removeEventListener('message', this.onResizeMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  onResizeMessage(event) {
    if (!event.data || event.data.type !== 'HIRESORT_RESIZE') return;
    const client = this.getAttribute('client') || 'default';
    if (event.data.clientSlug && event.data.clientSlug !== client) return;

    if (typeof event.data.height === 'number' && event.data.height > 100) {
      this.iframe.style.height = event.data.height + 'px';
    }
  }

  render() {
    const client = this.getAttribute('client') || 'default';
    const theme = this.getAttribute('theme') || 'dark';
    const atsUrl = this.getAttribute('ats-url') || (
      window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://app.hiresort.ai'
    );

    const embedUrl = `${atsUrl.replace(/\/$/, '')}/embed/careers/${encodeURIComponent(client)}?theme=${encodeURIComponent(theme)}`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 100%;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        iframe {
          width: 100%;
          height: 650px;
          min-height: 500px;
          border: none;
          display: block;
          border-radius: 12px;
          overflow: hidden;
          background-color: ${theme === 'dark' ? '#0b0f19' : '#ffffff'};
          transition: height 0.25s ease;
        }
      </style>
    `;

    this.iframe.src = embedUrl;
    this.iframe.title = `HireSort Careers — ${client}`;
    this.shadowRoot.appendChild(this.iframe);
  }
}

if (!customElements.get('hiresort-jobs')) {
  customElements.define('hiresort-jobs', HireSortJobsElement);
}

export default HireSortJobsElement;
