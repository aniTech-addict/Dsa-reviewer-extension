/**
 * Installs a navigation observer that broadcasts a `navigationEvent`
 * CustomEvent on `window` whenever the page navigates.
 *
 * Detects navigation through:
 * - the History API (`pushState` / `replaceState`)
 * - the modern Navigation API (`navigation.navigate`)
 * - `popstate` and `hashchange`
 *
 * Guards against double installation via `window.__navObserverInstalled`,
 * so calling this more than once is a no-op.
 *
 * @returns {function():void} Teardown function that restores the original
 *   History methods, removes all listeners, and clears the install guard.
 */
export function installNavigationObserver() {
  if (window.__navObserverInstalled) {
    return () => {};
  }
  window.__navObserverInstalled = true;

  /**
   * Normalizes a navigation and broadcasts it as a `navigationEvent`.
   * @param {Object} descriptor
   * @param {string} descriptor.source - e.g. 'pushState', 'navigationApi', 'popstate', 'hashchange'
   * @param {string} descriptor.url
   * @param {any} [descriptor.state]
   * @param {string} [descriptor.destination]
   * @param {any} [descriptor.rawArgs]
   */
  function notifyNavigation({ source, url, state = null, destination = null, rawArgs = null }) {
    window.dispatchEvent(
      new CustomEvent("navigationEvent", {
        detail: {
          source,
          url: url || window.location.href,
          state,
          destination,
          rawArgs
        }
      })
    );
  }

  const originalPushState = History.prototype.pushState;
  const originalReplaceState = History.prototype.replaceState;

  History.prototype.pushState = function pushState(...args) {
    const result = originalPushState.apply(this, args);
    notifyNavigation({
      source: "pushState",
      url: window.location.href,
      state: args[0] || null,
      destination: typeof args[2] === "string" ? args[2] : null,
      rawArgs: args
    });
    return result;
  };

  History.prototype.replaceState = function replaceState(...args) {
    const result = originalReplaceState.apply(this, args);
    notifyNavigation({
      source: "replaceState",
      url: window.location.href,
      state: args[0] || null,
      destination: typeof args[2] === "string" ? args[2] : null,
      rawArgs: args
    });
    return result;
  };

  const removals = [];

  if (window.navigation) {
    const onNavigate = (event) =>
      notifyNavigation({
        source: "navigationApi",
        url: event.destination.url,
        state: null,
        destination: event.destination.url,
        rawArgs: [event]
      });
    window.navigation.addEventListener("navigate", onNavigate);
    removals.push(() => window.navigation.removeEventListener("navigate", onNavigate));
  }

  const onPopstate = (event) =>
    notifyNavigation({
      source: "popstate",
      url: window.location.href,
      state: event.state || null,
      destination: window.location.href,
      rawArgs: [event]
    });
  window.addEventListener("popstate", onPopstate);
  removals.push(() => window.removeEventListener("popstate", onPopstate));

  const onHashchange = (event) =>
    notifyNavigation({
      source: "hashchange",
      url: event.newURL,
      state: null,
      destination: event.newURL,
      rawArgs: [event]
    });
  window.addEventListener("hashchange", onHashchange);
  removals.push(() => window.removeEventListener("hashchange", onHashchange));

  return function teardown() {
    History.prototype.pushState = originalPushState;
    History.prototype.replaceState = originalReplaceState;
    removals.forEach((remove) => remove());
    window.__navObserverInstalled = false;
  };
}
