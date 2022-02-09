import React from "react";
import { functionalOk, thirdPartyOk } from "../models/Cookie";

// A simple hook which will return an object stating wether functional- and third-party-cookies
// are OK to use or not (depending on the users choice in the cookie-notice).
export default function useCookieStatus(globalObserver) {
  // Let's combine both statuses in one state-object since they will always be updated at the same time.
  const [cookieStatus, setCookieStatus] = React.useState({
    functionalCookiesOk: functionalOk(),
    thirdPartyCookiesOk: thirdPartyOk(),
  });

  // An effect subscribing to an event sent from the cookie-handler when the
  // cookie-settings change. If the settings change, we make sure to update the
  // state with the current cookie-status so that we can render the appropriate components.
  React.useEffect(() => {
    globalObserver.subscribe("core.cookieLevelChanged", () =>
      setCookieStatus({
        functionalCookiesOk: functionalOk(),
        thirdPartyCookiesOk: thirdPartyOk(),
      })
    );
    return () => {
      globalObserver.unsubscribe("core.cookieLevelChanged");
    };
  }, [globalObserver]);

  return cookieStatus;
}
