/**
 * HireSort AI — Embeddable Careers Widget
 * Version: 1.0.0
 * 
 * Usage:
 *   Option 1: Container Div + Script
 *     <div id="hiresort-careers" data-client="zool" data-theme="dark"></div>
 *     <script src="http://localhost:8080/widget.js" async></script>
 * 
 *   Option 2: Standalone Script (mounts right at script location)
 *     <script src="http://localhost:8080/widget.js" data-client="zool" data-theme="dark"></script>
 */

(function () {
  'use strict';

  // Prevent duplicate initialization
  if (window.__HIRESORT_WIDGET_INITIALIZED__) {
    return;
  }
  window.__HIRESORT_WIDGET_INITIALIZED__ = true;

  // Determine ATS host URL from current script tag
  function getScriptBaseUrl() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('widget.js') !== -1) {
        try {
          var url = new URL(src, window.location.href);
          return url.origin;
        } catch (e) {
          // Fallback
        }
      }
    }
    return window.location.origin;
  }

  var atsBaseUrl = getScriptBaseUrl();

  // Initialize widget instance on a container element
  function initContainer(container, scriptElement) {
    if (container.getAttribute('data-hiresort-mounted') === 'true') {
      return;
    }
    container.setAttribute('data-hiresort-mounted', 'true');

    var clientSlug = container.getAttribute('data-client') || 
                     (scriptElement && scriptElement.getAttribute('data-client')) || 
                     'default';
    var theme = container.getAttribute('data-theme') || 
                (scriptElement && scriptElement.getAttribute('data-theme')) || 
                'dark';
    var hostUrl = container.getAttribute('data-ats-url') || 
                  (scriptElement && scriptElement.getAttribute('data-ats-url')) || 
                  atsBaseUrl;

    var iframe = document.createElement('iframe');
    iframe.src = hostUrl + '/embed/careers/' + encodeURIComponent(clientSlug) + '?theme=' + encodeURIComponent(theme);
    iframe.id = 'hiresort-iframe-' + clientSlug;
    iframe.title = 'HireSort Careers Portal — ' + clientSlug;
    iframe.style.width = '100%';
    iframe.style.minHeight = '500px';
    iframe.style.height = '650px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.style.transition = 'height 0.25s ease-in-out';
    iframe.style.backgroundColor = theme === 'dark' ? '#0b0f19' : '#ffffff';
    iframe.style.borderRadius = '12px';
    iframe.loading = 'lazy';

    // Clear container and append iframe
    container.innerHTML = '';
    container.appendChild(iframe);

    // Listen for resize messages from the embedded HireSort application
    function handleResize(event) {
      if (!event.data || event.data.type !== 'HIRESORT_RESIZE') {
        return;
      }
      if (event.data.clientSlug && event.data.clientSlug !== clientSlug) {
        return;
      }
      if (typeof event.data.height === 'number' && event.data.height > 100) {
        iframe.style.height = event.data.height + 'px';
      }
    }

    window.addEventListener('message', handleResize);
  }

  // Scan and mount all widget instances on page
  function mountAll() {
    // 1. Explicit containers by ID or data attribute
    var containers = document.querySelectorAll('#hiresort-careers, [data-hiresort-careers]');
    if (containers.length > 0) {
      for (var i = 0; i < containers.length; i++) {
        initContainer(containers[i]);
      }
      return;
    }

    // 2. Standalone script self-mount fallback
    var currentScript = document.currentScript;
    if (currentScript && currentScript.getAttribute('data-client')) {
      var wrapper = document.createElement('div');
      wrapper.id = 'hiresort-careers';
      currentScript.parentNode.insertBefore(wrapper, currentScript.nextSibling);
      initContainer(wrapper, currentScript);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();
