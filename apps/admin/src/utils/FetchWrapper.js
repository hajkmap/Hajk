// We need som default options before we
// get the real default options from appConfig
let config = {
  hfetch: {
    defaultOptions: { credentials: "same-origin" },
  },
};

// From appConfig it looks approx like this.
// "hfetch": {
//   "defaultOptions": {
//     "credentials": "same-origin"
//   },
//   "useOptionOverrides": true,
//   "optionOverrides": {
//     "*www.cachebuster.com*": {
//       "cacheBuster": true
//     },
//     "*wms-utv.varberg.se*": {
//       "credentials": "include"
//     },
//     "*www.requires-credentials.com*": {
//       "credentials": "include"
//     }
//   }
// }

const cacheBusterParamName = "cacheBuster";

class FetchWrapper {
  // Had to disable.... eslint does not like my regex for som reason.
  // eslint-disable-next-line no-useless-escape
  urlRegex = /([.*+?^=!:${}()|\[\]\/\\])/g;

  constructor(options = {}, config = {}) {
    this.isJqueryAjax = options.isJqueryAjax === true;
    this.config = config;
    this.url = "";
    this.options = {};

    // Hash is used for cacheBuster function.
    this.hash = process?.env?.REACT_APP_GIT_HASH || null;
    this.useCacheBuster =
      process?.env?.REACT_APP_USE_CACHE_BUSTER === "true" || false;
  }

  matchesUrlPart(url, ruleWithWildCard) {
    // Works with *, example:
    // monk* matches monkey
    // *nk* matches monkey
    // *key matches monkey

    const escapeRegex = (url) => url.replace(this.urlRegex, "\\$1");
    return new RegExp(
      "^" + ruleWithWildCard.split("*").map(escapeRegex).join(".*") + "$"
    ).test(url);
  }

  applyOptionOverrides() {
    if (!this.partKeys) {
      this.partKeys = Object.keys(this.config.hfetch.optionOverrides || {});
      this.partKeys.sort((a, b) => b.length - a.length);
    }

    const key = this.partKeys.find((key) => {
      return this.matchesUrlPart(this.url, key);
    });

    if (key) {
      // We've found a match!
      let overrides = this.config.hfetch.optionOverrides[key] || {};
      this.options = Object.assign(this.options, overrides);
    }
  }

  translateToJqueryAjaxOptions() {
    // translate credentials to work with $.ajax(), old admin UI.
    // Will be used in admin later.
    if (this.options.credentials && this.options.credentials === "include") {
      this.options.xhrFields = { withCredentials: true };
      delete this.options.credentials; // clean up.
    }
  }

  overrideOptions() {
    this.options = Object.assign(
      { ...this.config.hfetch.defaultOptions },
      this.options
    );

    if (this.config.hfetch.useOptionOverrides) {
      this.applyOptionOverrides();
    }

    if (this.isJqueryAjax) {
      // handle $.ajax() specific things.
      // Will be used in admin later.
      this.translateToJqueryAjaxOptions();
    }

    if (this.useCacheBuster === true) {
      // cacheBuster will force browser to reload the file.
      // In this case it's using git commit hash.
      // So every new Hajk version that's build will force reload.

      if (
        this.options.cacheBuster === true ||
        (this.mapserviceBaseUri &&
          this.url.indexOf(this.mapserviceBaseUri) === 0)
      ) {
        let cacheBuster = `${
          this.url.indexOf("?") === -1 ? "?" : "&"
        }${cacheBusterParamName}=${this.hash}`;
        this.url = `${this.url}${cacheBuster}`;
      }
    }
  }

  updateConfig(config) {
    this.config = config;
    this.mapserviceBase = this.config.mapserviceBase || "";
    this.proxy = this.config.proxy || "";
    this.mapserviceBaseUri = `${this.proxy}${this.mapserviceBase}`;
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

function overrideLayerSourceParams(source) {
  let fw = fetchWrapper;
  fw.reset();
  fw.url = source.url;
  fw.options = { ...source };
  if (fw.config.hfetch.useOptionOverrides) {
    fw.applyOptionOverrides();
  }
  if (fw.options?.credentials === "include") {
    if (source.crossOrigin) {
      // handle crossOrigin in tile images etc
      source.crossOrigin = "use-credentials";
    }
  }
}

function hfetch(...args) {
  let fw = fetchWrapper;
  fw.reset();
  fw.url = args[0];

  fw.options = args[1] || {};
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
    // Assume $.ajax(object with url)
    jw.options = Object.assign({}, args[0]);
    jw.overrideOptions();
    return originalJqueryAjax(jw.options);
  } else if (args.length === 2) {
    // Assume $.ajax(url, options)
    jw.options = args[1];
    jw.overrideOptions();
    return originalJqueryAjax(jw.url, jw.options);
  }
}

export {
  initFetchWrapper,
  initHFetch,
  hfetch,
  wrapJqueryAjax,
  overrideLayerSourceParams,
};
