// We need som default options before we
// get the real default options from appConfig
let config = {
  fetch: {
    defaultOptions: { credentials: "same-origin" },
  },
};

// From appConfig it looks approx like this.
// let config = {
//   fetch: {
//     useDomainOverrides: true,
//     defaultOptions: { credentials: "same-origin" },
//     domainOverrides: {
//       "www.requires-credentials.com": {
//         credentials: "include",
//       },
//     },
//   },
// };

class FetchWrapper {
  // Had to disable.... eslint does not like my regex for som reason.
  // eslint-disable-next-line no-useless-escape
  domainRegex = /^(http:|https:|.*)(\/\/)([^\/]+)/gi;
  constructor(options = {}, config = {}) {
    this.isJqueryAjax = options.isJqueryAjax === true;
    this.config = config;
    this.url = "";
    this.options = {};
  }

  applyDomainOverrides() {
    this.domainRegex.lastIndex = 0;
    let matches = this.domainRegex.exec(this.url);
    if (matches && matches.length === 4) {
      let domain = matches[3];
      let overrides = this.config.fetch.domainOverrides[domain] || {};
      this.options = Object.assign(this.options, overrides);
    }
    matches = null;
  }

  translateToJqueryAjaxOptions() {
    // translate credentials to work with $.ajax(), old admin UI.
    if (this.options.credentials && this.options.credentials === "include") {
      this.options.xhrFields = { withCredentials: true };
      delete this.options.credentials; // clean up.
    }
  }

  overrideOptions() {
    this.options = Object.assign(
      { ...this.config.fetch.defaultOptions },
      this.options
    );

    if (this.config.fetch.useDomainOverrides) {
      this.applyDomainOverrides();
    }

    if (this.isJqueryAjax) {
      // handle $.ajax() specific things.
      this.translateToJqueryAjaxOptions();
    }
  }

  updateConfig(config) {
    this.config = config;
  }

  reset() {
    this.options = {};
    this.url = "";
  }
}

let fetchWrapper = null;
let originalFetch = null;

function initFetchWrapper(appConfig) {
  config = Object.assign(config, appConfig);
  if (fetchWrapper) {
    fetchWrapper.updateConfig(config);
  }
  if (jqueryAjaxWrapper) {
    jqueryAjaxWrapper.updateConfig(config);
  }
}

function initHFetch() {
  if (fetchWrapper) {
    throw new Error("You should only initiate wrapFetch once");
  }
  fetchWrapper = new FetchWrapper({}, config);
  originalFetch = fetch;

  return hfetch;
}

function hfetch(...args) {
  let fw = fetchWrapper;
  fw.reset();
  fw.url = args[0];

  fw.options = args[1];
  fw.overrideOptions();
  //console.log("hfetch", fw.url, fw.options);
  return originalFetch(fw.url, fw.options);
}

let jqueryAjaxWrapper = null;
let originalJqueryAjax = null;

function wrapJqueryAjax(jqueryObject) {
  if (jqueryAjaxWrapper) {
    throw new Error("You should only initiate wrapJqueryAjax once");
  }
  jqueryAjaxWrapper = new FetchWrapper({ isJqueryAjax: true }, config);
  originalJqueryAjax = jqueryObject.ajax;
  jqueryObject.ajax = xJqueryAjax;
}

function xJqueryAjax(...args) {
  let jw = jqueryAjaxWrapper;
  jw.reset();
  jw.url = args[0];

  if (args.length === 1) {
    // Assume $.ajax(object with url) and convert it.
    jw.url = args[0].url;
    jw.options = args;
    delete jw.options.url; // clean up.
  } else if (args.length === 2) {
    // Assume $.ajax(url, options)
    jw.options = args[1];
  }
  jw.overrideOptions();
  //console.log("xJqueryAjax", jw.url, jw.options);
  return originalJqueryAjax(jw.url, jw.options);
}

export { initFetchWrapper, initHFetch, hfetch, wrapJqueryAjax };
