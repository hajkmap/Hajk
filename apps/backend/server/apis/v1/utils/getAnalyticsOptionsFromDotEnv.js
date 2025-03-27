/**
 * @description Parse options in dotenv and create correct Analytics config.
 * @summary This helper is used in config.service and config.service.v2. It will
 * parse some of the dotenv options and try to create a valid analytics configuration.
 * The returned object will, in turn, be added to the mapConfig that goes out to Client.
 * @export
 * @return {object} AnalyticsConfig
 */
export default function getAnalyticsOptionsFromDotEnv() {
  // Prepare the object that will hold options parsed from .env
  const parsedOptions = {};

  // Loop through all .env params and…
  Object.entries(process.env)
    // …take care of those that are of interest in this case.
    .filter(([k]) => k.startsWith("ANALYTICS_"))
    .map(([k, v]) => {
      // Get rid of the leading "ANALYTICS_" and convert to lower case.
      k = k.replace("ANALYTICS_", "").toLowerCase();

      // Put the result into the object that holds our parsed options.
      parsedOptions[k] = v;
    });

  // We support different analytics services. The options will have
  // different names and need different mapping, depending on service
  // used.
  switch (parsedOptions.type) {
    // For Plausible…
    case "plausible":
      // … add the 'analytics' property to our JSON output…
      return {
        type: "plausible",
        // …that has the options needed by the plausible-tracker.
        options: {
          domain: parsedOptions.option_domain,
          apiHost: parsedOptions.option_apihost,
          trackLocalhost: parsedOptions.option_tracklocalhost,
        },
      };
    // TODO: Adding support for Matomo should be as simple as…
    // case "matomo":
    //   return {
    //     type: "matomo",
    //     options: {
    //       siteId: parsedOptions.option_siteid,
    //       trackerUrl: parsedOptions.option_trackerurl,
    //     },
    //   };

    default:
      break;
  }
}
