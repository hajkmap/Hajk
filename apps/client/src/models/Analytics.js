import MatomoTracker from "@jonkoops/matomo-tracker";

import { createPlausibleTracker } from "@barbapapazes/plausible-tracker";
import {
  useAutoOutboundTracking,
  useAutoFileDownloadsTracking,
  defaultFileTypes,
} from "@barbapapazes/plausible-tracker/extensions";

/**
 * @description Each of the provided analytics services must subscribe to two
 * events on the global observer:
 * analytics.trackPageView - takes no other parameters
 * analytics.trackEvent - requires one parameter, data. The parameter should have this type:
 *    {
 *      eventName: string,
 *      ...optionalProperties?: string | number
 *    }
 * Event name is required, while the remaining properties are optional, but could come
 * in handy when we want to provide additional payload to the event sent.
 *
 * @example
 * ```
 * // Track a page view
 * this.globalObserver.publish("analytics.trackPageView");
 *
 * // Track event named "customEvent", supply some payload
 * this.globalObserver.publish("analytics.trackEvent", {
 *  eventName: "customEvent",
 *  paramA: "foo",
 *  paramB: "bar"
 * });
 * ```
 *
 * @export
 * @class Analytics
 */
export default class Analytics {
  constructor(config, globalObserver) {
    switch (config?.type) {
      case "plausible":
        const { domain, apiHost, trackLocalhost } = config.options;

        // Setup the minimal Plausible tracker
        const plausible = createPlausibleTracker({
          domain,
          apiHost,
          // Note that `trackLocalhost` is a string, not a boolean
          ignoredHostnames: trackLocalhost === "true" ? [] : ["localhost"],
        });

        // Extend the minimal tracker with auto tracking of outbound links.
        const { install: installAutoOutboundTracking } =
          // Since the function we want to call now starts with "use",
          // but is not a React hook and we don't want ESlint to complain, we must:
          // eslint-disable-next-line
          useAutoOutboundTracking(plausible);
        installAutoOutboundTracking();

        // Extend the minimal tracker with auto tracking of file downloads.
        const { install: installAutoFileDownloadsTracking } =
          // eslint-disable-next-line
          useAutoFileDownloadsTracking(plausible, {
            fileTypes: ["gpkg", ...defaultFileTypes], // Track GeoPackage files, in addition to defaults
          });
        installAutoFileDownloadsTracking();

        // Link our internal tracking events to the Plausible tracker.
        globalObserver.subscribe("analytics.trackPageView", () =>
          plausible.trackPageview()
        );

        globalObserver.subscribe(
          "analytics.trackEvent",
          ({ eventName, ...rest }) => {
            plausible.trackEvent(eventName, { props: rest });
          }
        );
        break;
      case "matomo":
        let { siteId, trackerUrl } = config.options;

        const matomo = new MatomoTracker({
          urlBase: trackerUrl,
          siteId: siteId,
        });

        // Because of the nature of Matomo and how the tracking was implemented
        // we need to use a translate table to get the values we need.
        // If new events are added they will need to be added here as well.

        const eventValueKeys = {
          pluginShown: "pluginName",
          mapLoaded: "activeMap",
          layerShown: "layerName (layerId)", // concat the name and id.
          spatialSearchPerformed: "type",
          textualSearchPerformed: "query",
        };

        const regex = /[a-z0-0_].?[a-z0-9_]*/gim;

        const getValue = (eventName, data) => {
          // This gives us the possibility to merge values to one string, see layerShown
          const propNames = eventValueKeys[eventName];
          let value = propNames;
          let m;
          const repl = (match) => {
            value = value.replace(match, data[match]);
          };

          while ((m = regex.exec(propNames)) !== null) {
            if (m.index === regex.lastIndex) {
              regex.lastIndex++;
            }
            m.forEach(repl);
          }
          return value;
        };

        globalObserver.subscribe("analytics.trackPageView", () => {
          matomo.trackPageView();
        });

        globalObserver.subscribe(
          "analytics.trackEvent",
          ({ eventName, ...rest }) => {
            const value = getValue(eventName, rest);

            if (eventName.indexOf("SearchPerformed") > -1) {
              // spatial or textual
              matomo.trackSiteSearch({
                keyword: value,
                category: eventName,
                count: rest.totalHits, // always zero for spatial searches.
              });
              return;
            }

            // We send the retrieved value using the name prop which is predefined in Matomo.
            // The value prop is in useless in our cases as it only supports numbers.
            matomo.trackEvent({
              category: "general",
              action: eventName,
              name: value,
              value: 0,
            });
          }
        );
        break;

      default:
        break;
    }
  }
}
