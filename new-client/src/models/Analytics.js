import Plausible from "plausible-tracker";
import MatomoTracker from "@jonkoops/matomo-tracker";

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
    config = {};
    config.options = {};
    config.type = "matomo";
    switch (config?.type) {
      case "plausible":
        const { domain, apiHost, trackLocalhost } = config.options;
        const plausible = Plausible({
          domain,
          apiHost,
          trackLocalhost,
        });

        // These events should be called like this and subscribed to by
        // any analytics service. Below we define two events:
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
        // TODO: Remove hardcoded siteId and trackerUrl....
        siteId = 3;
        trackerUrl = "https://varbergsstatistik.matomo.cloud";

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
          layerShown: "layerName (layerId)",
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

            // TODO: handle search with Matomos specific search request.
            // matomo.trackSiteSearch()
            // TODO: how will we handle spatial searches?

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
