import Plausible from "plausible-tracker";

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
          ({ eventName, ...rest }) =>
            plausible.trackEvent(eventName, { props: rest })
        );
        break;
      case "matomo":
        // TODO: Adding support for Matomo should be as simple as…
        //
        // npm install matomo-tracker
        // import MatomoTracker from 'matomo-tracker';

        // Initialize with your site ID and Matomo URL
        // const { siteId, trackerUrl } = config.options;
        // const matomo = new MatomoTracker(siteId, trackerUrl);

        // Next, subscribe to our two global observer events. Call
        // corresponding Matomo methods:
        // globalObserver.subscribe("analytics.trackPageView", () =>
        //   matomo.track()
        // );

        // globalObserver.subscribe(
        //   "analytics.trackEvent",
        //   ({ eventName, ...rest }) =>
        //     matomo.track({ actionName: eventName, ...rest })
        // );
        break;

      default:
        break;
    }
  }
}
