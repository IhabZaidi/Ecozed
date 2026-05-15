let initialized = false;

export function initAuthInterceptor() {
  if (initialized) return;
  initialized = true;

  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await originalFetch(input, init);
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.replace(/^https?:\/\/[^/]+/, "");

    // Only intercept /api/ calls (not auth endpoints, not external)
    if (
      res.status === 401 &&
      path.startsWith("/api/") &&
      !path.startsWith("/api/auth/") &&
      !window.location.pathname.startsWith("/login")
    ) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }, 0);
    }

    return res;
  };
}
