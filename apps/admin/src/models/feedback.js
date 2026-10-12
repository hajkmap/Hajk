import { Model } from "backbone";
import $ from "jquery";

/**
 * Extracts a human readable error message from a failed $.ajax request.
 * The backend responds with `{ error: "message" }` on non-2xx responses.
 */
function getErrorMessage(xhr, fallback) {
  const backendError = xhr && xhr.responseJSON && xhr.responseJSON.error;
  if (typeof backendError === "string" && backendError.trim() !== "") {
    return backendError;
  }
  if (xhr && xhr.status === 0) {
    return `${fallback} Servern svarar inte.`;
  }
  return `${fallback} (${xhr ? xhr.status : "?"} ${
    xhr && xhr.statusText ? xhr.statusText : ""
  })`.trim();
}

/**
 * Model for the admin "Feedback" tab. Talks to the backend's admin-only
 * feedback endpoints (GET/DELETE {url}, GET {url}/stats).
 *
 * All callbacks are called node-style: callback(errorMessage, data).
 */
var feedback = Model.extend({
  defaults: {
    config: null,
  },

  getBaseUrl: function () {
    const config = this.get("config");
    return config && config.url ? config.url.replace(/\/+$/, "") : null;
  },

  request: function (path, method, errorText, callback) {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      callback(
        "Konfiguration saknas: lägg till 'feedback.url' i admins config.json."
      );
      return;
    }
    $.ajax({
      url: baseUrl + path,
      method: method,
      dataType: "json",
      cache: false,
      success: (data) => {
        callback(null, data);
      },
      error: (xhr) => {
        callback(getErrorMessage(xhr, errorText));
      },
    });
  },

  getStats: function (callback) {
    this.request(
      "/stats",
      "GET",
      "Kunde inte hämta statistik för feedback.",
      callback
    );
  },

  getEntries: function (callback) {
    this.request("", "GET", "Kunde inte hämta feedback.", (error, data) => {
      callback(error, Array.isArray(data) ? data : []);
    });
  },

  deleteAll: function (callback) {
    this.request("", "DELETE", "Kunde inte radera feedback.", callback);
  },
});

export default feedback;
