import Plausible from "plausible-tracker";

export default class Analytics {
  constructor(config, globalObserver) {
    switch (config?.type) {
      case "plausible":
        console.log(
          "Activating Plausible Analytics with config: ",
          config.options
        );

        const { domain, apiHost, trackLocalhost } = config.options;
        const plausible = Plausible({
          domain,
          apiHost,
          trackLocalhost,
        });

        // These events should be called like this and subscribed to by
        // any analytics service. Below we define two events:
        globalObserver.subscribe("trackPageview", () =>
          plausible.trackPageview()
        );
        globalObserver.subscribe("trackEvent", (eventName) =>
          plausible.trackEvent(eventName)
        );
        break;
      case "matomo":
        break;

      default:
        break;
    }
  }
}
