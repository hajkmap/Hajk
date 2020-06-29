import React, { useEffect } from "react";

import { useSnackbar } from "notistack";

import { IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";

/**
 * You should have something like this in your appConfig.json in
 * order for this to work:
 * 
 * "announcements": [
      {
        "id": 1, // Numeric. Must be a unique ID for this item in array of objects.
        "text": "Message to show to the user. Keep it short.", // String. Self-documenting. 
        "active": true, // Boolean. Makes it possible to turn off messages completely without removing them.
        "showOnlyOnce": true, // Boolean. If true, a cookie will be saved on users browser and message will show only once.
        "maps": ["jw", "map_1"], // Array. Only specified maps will show message.
        "timeout": null, // null or Numeric. Snackbar will auto hide after specified amount of millisecond, or be persistent (if null).
        "startTime": "2020-01-01", // DateTime. Earliest timestamp for this to be visible. Must be a string parsable by Date.parse().
        "stopTime": "2020-12-31", // DateTime. Last timestamp when this will be visible.
        "type": "info" // String. See Notistack docs for allowed options, usually "default", "info", "warning", "success" and "error".
      }, {
        "id": 2, 
        // ... and so on
      }, 
      // ... and more objects here
    ]
 * 
 */

function Announcement({ announcements = [], currentMap }) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /**
   * Runs once. Filters the supplied announcements according to some conditions:
   *  - should this be shown for current map?
   *  - is it set to be activated?
   *  - does it fit within the (optional) date/time limitations?
   *  - is it set to only show up once, and if so, has it already been shown?
   *
   * All items that make it through all these tests are then sent to the
   * snackbar, which shows a nice message to the user.
   */
  useEffect(() => {
    // First, we define some helper filter functions.

    /**
     * Time filter. If an item has start/stop restrictions,
     * compare those to the current timestamp. Show only if the restrictions
     * are met.
     */
    const timeFilter = a => {
      const now = new Date().getTime();
      const startTime = Date.parse(a.startTime);
      const stopTime = Date.parse(a.stopTime);

      const validStartTime = !Number.isNaN(startTime);
      const validStopTime = !Number.isNaN(stopTime);

      if (validStartTime && validStopTime) {
        // If both start and stop are sat, now must be within
        return startTime < now && now < stopTime;
      } else if (validStartTime && !validStopTime) {
        // There's only a start time - show indefinitely if we're past it
        return startTime < now;
      } else if (!validStartTime && validStopTime) {
        // There's only a stop time, show if we haven't got there yet
        return now < stopTime;
      }

      // Finally, if none of the date strings parsed, it
      // means there are no time restrictions, let's show this.
      return true;
    };

    /**
     * See if ID of a given item exists in an array retrieved from local storage.
     * If the item is set to be shown only once, and it exists in the array already,
     * don't show it again. If it, on the other hand, is missing from the array,
     * show it _and_ add its ID to the array, so it won't show up again.
     */
    const localStorageFilter = a => {
      // If local storage flag is off, show this item.
      if (a.showOnlyOnce !== true) return true;

      // If we got this far, admin wants to use local storage.

      // First, see if we've already shown this item.
      const shownIds =
        window.localStorage.getItem("shownAnnouncementIds") || ""; // Avoid null value - it can't be parsed to array easily
      const aShownIds = shownIds.split(",").filter(Boolean); // Create an array by splitting on commas; remove empty values by comparing to a Boolean
      if (aShownIds.includes(a.id.toString())) {
        // If ID is in array, item has already been shown
        return false;
      }

      // If we got this far, admin want's to show this item,
      // but only once - so let's return true, but also add
      // current id to the cookie array.
      aShownIds.push(a.id);
      const sShownIds = aShownIds.join();
      window.localStorage.setItem("shownAnnouncementIds", sShownIds);
      return true;
    };

    /**
     * If current map exists in the "maps" array for a given item, or if "maps" is a
     * string with value "all", show this notification. Else, don't show it.
     */
    const mapFilter = a => {
      // If "all" is specified, no filtering is needed
      if (a.maps === "all") return true;

      // Else if an array is provided, check and see that current map exists in the array
      if (Array.isArray(a.maps)) return a.maps.includes(currentMap);

      // If anything else is provided, it is an invalid value. Just exit.
      return false;
    };

    /**
     * Helper method: whatever is left in the announcements array after
     * all checks will be mapped to this render method.
     */
    const renderSnackbar = f => {
      if (!f?.text) return; // A text is required. If there's nothing to display, get out of here

      // Persistent snackbars will need an action that displays a close button.
      const action = key => {
        return (
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => closeSnackbar(key)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        );
      };

      enqueueSnackbar(f?.text, {
        variant: f?.type || "default", // Allowed variants are "default", "info", "warning", "success" and "error"
        ...(Number.isFinite(f?.timeout) && { autoHideDuration: f?.timeout }), // If timeout is Numeric, auto hide
        ...(!Number.isFinite(f?.timeout) && { persist: true, action }) // If timeout isn't Numeric, snackbar is persistent
      });
    };

    // Now we're done defining helpers and can proceed with the actual filtration.
    // Let's oop through all announcements and do some checks to filter out those
    // that should be displayed.
    const filtered = announcements
      .filter(a => mapFilter(a)) // Show only announcements for the current map
      .filter(a => a.active === true) // Only active announcements
      .filter(a => timeFilter(a)) // Respect possible date/time restrictions
      .filter(a => localStorageFilter(a)); // Show only once if admin said so, by checking a local storage setting

    // Filtering is done, now let's invoke render for those
    // items that made it this far.
    filtered.forEach(f => renderSnackbar(f));
  }, [announcements, currentMap, enqueueSnackbar, closeSnackbar]);

  // Finally, React's render _must_ return something…
  return null;
}

// Prevent unnecessary re-runs by explicitly comparing the relevant prop
function arePropsEqual(prevProps, nextProps) {
  return prevProps.announcements.length === nextProps.announcements.length;
}

export default React.memo(Announcement, arePropsEqual);
