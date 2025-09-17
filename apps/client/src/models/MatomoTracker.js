export default class MatomoTracker {
  constructor({ urlBase, siteId, cookieLess = false }) {
    // Input validation
    if (!urlBase || !siteId) {
      throw new Error("MatomoTracker requires urlBase and siteId");
    }

    this.url = urlBase.endsWith("matomo.php")
      ? urlBase
      : urlBase + "matomo.php";
    this.siteId = siteId;
    this.cookieLess = cookieLess;

    // If not cookieLess, generate or reuse a visitor ID
    if (!this.cookieLess) {
      this.visitorId = localStorage.getItem("matomo_vid");
      if (!this.visitorId) {
        this.visitorId = this._generateVisitorId();
        localStorage.setItem("matomo_vid", this.visitorId);
      }
    }
  }

  _generateVisitorId() {
    return crypto.randomUUID().replace(/-/g, "");
  }

  async _send(params) {
    params.set("idsite", this.siteId);
    params.set("rec", "1");
    params.set("apiv", "1");
    params.set("uadata", JSON.stringify(navigator.userAgentData || {}));

    const now = new Date();
    params.set("h", now.getHours());
    params.set("m", now.getMinutes());
    params.set("s", now.getSeconds());

    const url =
      typeof window !== "undefined" ? window.location.href : undefined;

    if (url) {
      params.set("url", url);
    }

    if (!this.cookieLess && this.visitorId) {
      params.set("_id", this.visitorId);
    }

    // Always send referrer and screen resolution when available
    if (typeof document !== "undefined" && document.referrer) {
      params.set("urlref", document.referrer);
    }
    if (typeof window !== "undefined" && window.screen) {
      params.set("res", `${window.screen.width}x${window.screen.height}`);
    }

    try {
      const response = await fetch(`${this.url}?${params.toString()}`, {
        method: "GET",
        mode: "no-cors", // Matomo tracking doesn't need CORS
      });

      if (!response.ok) {
        console.debug(
          `Matomo tracking returned ${response.status}: ${response.statusText}`
        );
      }
    } catch (err) {
      console.debug("Matomo tracking failed:", err);
      // Re-throw for optional error handling in calling code
      throw err;
    }
  }

  trackPageView() {
    const title = typeof document !== "undefined" ? document.title : undefined;

    const params = new URLSearchParams();
    if (title) params.set("action_name", title);
    return this._send(params);
  }

  trackSiteSearch(keyword, category, count) {
    const params = new URLSearchParams({
      search: keyword,
      search_cat: category || "",
      search_count: count?.toString() || "0",
    });
    return this._send(params);
  }

  trackEvent(category, action, name, value) {
    const params = new URLSearchParams({
      e_c: category,
      e_a: action,
    });
    if (name) params.set("e_n", name);
    if (value !== undefined) params.set("e_v", value.toString());
    return this._send(params);
  }
}
