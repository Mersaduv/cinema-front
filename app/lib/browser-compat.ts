import { CRYPTO_RANDOM_UUID_POLYFILL } from "./random-id";

/** Early browser compatibility shims — must run before app bundles. */
export const BROWSER_COMPAT_POLYFILLS = `
${CRYPTO_RANDOM_UUID_POLYFILL}
(function() {
  if (typeof Element !== 'undefined' && !Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      var node = this;
      while (node) {
        if (node.nodeType === 1 && node.matches && node.matches(selector)) {
          return node;
        }
        node = node.parentElement || node.parentNode;
      }
      return null;
    };
  }

  if (typeof window !== 'undefined' && typeof window.structuredClone !== 'function') {
    window.structuredClone = function(value) {
      return JSON.parse(JSON.stringify(value));
    };
  }
})();
`.trim();
