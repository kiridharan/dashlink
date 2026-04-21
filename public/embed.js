/**
 * DashLink embed SDK.
 *
 * Usage:
 *   <div data-dashlink="<slug>" data-widget="<widget-id>" data-height="320"></div>
 *   <script src="https://your-host/embed.js" defer></script>
 *
 * Or programmatically:
 *   DashLink.embed({ target: "#my-div", slug: "abc123", widget: "kpi-foo" });
 */
(function () {
  "use strict";

  var ORIGIN = (function () {
    try {
      // The script tag's src tells us where DashLink is hosted.
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || "";
        if (src.indexOf("/embed.js") !== -1) {
          return new URL(src).origin;
        }
      }
    } catch (e) {
      /* noop */
    }
    return window.location.origin;
  })();

  function buildUrl(slug, widget) {
    var path = "/embed/" + encodeURIComponent(slug);
    if (widget) path += "/" + encodeURIComponent(widget);
    return ORIGIN + path;
  }

  function makeIframe(slug, widget, height) {
    var iframe = document.createElement("iframe");
    iframe.src = buildUrl(slug, widget);
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.height = (height || 360) + "px";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("title", "DashLink dashboard");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups",
    );
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    return iframe;
  }

  function embed(opts) {
    if (!opts || !opts.slug) {
      console.error("[DashLink] embed() requires a 'slug'");
      return null;
    }
    var target =
      typeof opts.target === "string"
        ? document.querySelector(opts.target)
        : opts.target;
    if (!target) {
      console.error("[DashLink] target element not found:", opts.target);
      return null;
    }
    var iframe = makeIframe(opts.slug, opts.widget, opts.height);
    target.innerHTML = "";
    target.appendChild(iframe);
    return iframe;
  }

  function autoMount() {
    var nodes = document.querySelectorAll("[data-dashlink]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute("data-dashlink-mounted") === "1") continue;
      var slug = el.getAttribute("data-dashlink");
      var widget = el.getAttribute("data-widget") || undefined;
      var height = parseInt(el.getAttribute("data-height") || "0", 10);
      if (!slug) continue;
      var iframe = makeIframe(slug, widget, height || 360);
      el.innerHTML = "";
      el.appendChild(iframe);
      el.setAttribute("data-dashlink-mounted", "1");
    }
  }

  window.DashLink = { embed: embed, autoMount: autoMount, ORIGIN: ORIGIN };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
})();
