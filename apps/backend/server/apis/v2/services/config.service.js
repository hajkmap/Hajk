import fs from "fs";
import path from "path";
import log4js from "log4js";
import { XMLParser } from "fast-xml-parser";

import ad from "./activedirectory.service.js";
import asyncFilter from "../utils/asyncFilter.js";
import getAnalyticsOptionsFromDotEnv from "../utils/getAnalyticsOptionsFromDotEnv.js";
import { AccessError } from "../utils/AccessError.js";

const logger = log4js.getLogger("service.config.v2");

// Prepare a delay utility - we don't want to send all fetch request simultaneously
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ConfigServiceV2 {
  constructor() {
    // TODO: As reading files is expansive, we can read all
    // JSON files on init and keep then in-memory. Subsequent
    // reads will be served from this in-memory store.
    // We should also implement an update-store method, perhaps
    // have a global bus (using EventEmitter?), so we can trigger
    // re-reads from FS into our in-memory store.
    logger.trace("Initiating ConfigService V2");
    // Prepare the XML parser
    this.xmlParser = new XMLParser();
  }

  /**
   * @summary Get contents of a map configuration as JSON object, if AD is active
   * a check will be made to see if specified user has access to the map.
   *
   * @param {String} map Name of the map configuration
   * @param {String} user User name that must have explicit access to the map
   * @param {boolean} washContent If true, map config will be examined and
   * only those layers/groups/tools that user has access to will be returned.
   * @returns Map config contents in JSON
   * @memberof ConfigService
   */
  async getMapConfig(map, user, washContent = true) {
    try {
      const pathToFile = path.join(process.cwd(), "App_Data", `${map}.json`);
      const text = await fs.promises.readFile(pathToFile, "utf-8");
      const json = await JSON.parse(text);

      // Ensure that we print the correct API version to output
      json.version = 2.1;

      // Ensure that we provide Analytics configuration from .env, if none exists in
      // mapConfig yet but there are necessary keys in process.env.
      if (
        json.analytics === undefined &&
        ["plausible", "matomo"].includes(process.env.ANALYTICS_TYPE)
      ) {
        json.analytics = getAnalyticsOptionsFromDotEnv();
      }

      if (washContent === false) {
        logger.trace(
          "[getMapConfig] invoked with 'washContent=false' for user %s. Returning the entire %s map config.",
          user,
          map
        );
        return json;
      }

      // If we haven't enabled AD restrictions, just return the entire map config
      if (process.env.AD_LOOKUP_ACTIVE !== "true") {
        logger.trace(
          "[getMapConfig] AD auth disabled. Getting the entire %s map config.",
          map
        );
        return json;
      }

      logger.trace(
        "[getMapConfig] Attempting to get %s for user %s",
        map,
        user
      );

      // If we got this far, it looks like MapService is configured to respect AD restrictions.

      // First, ensure that we have a valid user name. This is necessary for AD lookups.
      if ((await ad.isUserValid(user)) !== true) {
        const e = new AccessError(
          "[getMapConfig] AD authentication is active, but no valid user name was supplied. Access restricted."
        );
        logger.error(e.message);
        throw e;
      }

      // Now let's see if the user has access to the map config. If not, there's no
      // need to further "wash" groups/layers, so we do it first.
      const visibleForGroups = json.tools.find(
        (t) => t.type === "layerswitcher"
      ).options?.visibleForGroups;

      if (Array.isArray(visibleForGroups) && visibleForGroups.length > 0) {
        logger.trace(
          "[getMapConfig] Access to %s is allowed only for the following groups: %o. \nChecking if %s is member in any of them…",
          map,
          visibleForGroups,
          user
        );

        for (const group of visibleForGroups) {
          const isMember = await ad.isUserMemberOf(user, group);

          logger.trace(
            "[getMapConfig] Is %s? member of %s? %o ",
            user,
            group,
            isMember
          );

          // "Wash" the contents of map config given current user's group membership and return the results
          if (isMember === true)
            return washContent ? await this.washMapConfig(json, user) : json;
        }

        // If we got this far, it looks as the current user isn't member in any
        // of the required groups - hence no access can be given to the map.
        const e = new AccessError(
          `[getMapConfig] Access to map "${map}" not allowed for user "${user}"`
        );

        // Write a debug message to log telling that user can't access current layer
        logger.debug(e.message);

        throw e;
      } else {
        // It looks as the map config itself has no restrictions.
        // There can still be restrictions inside specific tools and layers though,
        // so let's "wash" the response before returning.
        return washContent ? await this.washMapConfig(json, user) : json;
      }
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Takes a look at which layers are used in mapConfig and removes the
   * unused ones from layersConfig.
   *
   * @param {object} mapConfig
   * @param {object} layersConfig
   * @returns {object} streamlinedLayersConfig that only contains used layers
   * @memberof ConfigServiceV2
   */
  #removeUnusedLayersFromStore(mapConfig, layersConfig) {
    // Helper - recursively extract IDs of layers from all groups
    const getLayerIdsFromGroup = (group) => {
      return [
        ...(group.layers?.map((l) => l.id) || []),
        ...(group.groups?.flatMap((g) => getLayerIdsFromGroup(g)) || []),
      ];
    };

    // The idea is simple: we take a look everywhere references to layers
    // can exist in map config, and grab the IDs of used layers.
    // Next, we collect those IDs into a Set (to get rid of duplicates).
    // Finally, we loop through the entire layers config and keep only
    // those layers whose IDs can be found in the Set.

    // Keep in mind: we can not be sure that _any_ of these plugins, nor
    // their options exist, but we _must_ ensure that we get an Array to
    // each of the following constants. Hence the frequent use of '?.' and '||'.

    // Grab layers and baselayers from LayerSwitcher
    const lsOptions = mapConfig.tools.find(
      (t) => t.type === "layerswitcher"
    )?.options;
    const baseLayerIds = lsOptions?.baselayers.map((bl) => bl.id) || [];
    const layerIds =
      lsOptions?.groups.flatMap((g) => getLayerIdsFromGroup(g)) || [];

    // Grab layers from Search
    const searchOptions = mapConfig.tools.find(
      (t) => t.type === "search"
    )?.options;
    const searchLayerIds = searchOptions?.layers.map((l) => l.id) || [];

    // Grab layers from Edit
    const editOptions = mapConfig.tools.find((t) => t.type === "edit")?.options;
    let editLayerIds = [];

    if (editOptions !== undefined) {
      if (
        editOptions.activeServices &&
        editOptions.activeServices.length !== 0
      ) {
        if (
          typeof editOptions.activeServices[0].visibleForGroups === "undefined"
        ) {
          // if visibleForGroups is undefined the activeServices is an array of id's
          editLayerIds = editOptions?.activeServices.map((as) => as) || [];
        } else {
          // else the activeServices is an array of objects with "id" and "visibleForGroups"
          editLayerIds = editOptions?.activeServices.map((as) => as.id) || [];
        }
      }
    }

    // Grab layers from Survey
    const editOptionsSurvey = mapConfig.tools.find(
      (t) => t.type === "survey"
    )?.options;
    let editLayerIdsSurvey = [];

    if (editOptionsSurvey !== undefined) {
      if (
        editOptionsSurvey.activeServices &&
        editOptionsSurvey.activeServices.length !== 0
      ) {
        if (
          typeof editOptionsSurvey.activeServices[0].visibleForGroups ===
          "undefined"
        ) {
          // if visibleForGroups is undefined the activeServices is an array of id's
          editLayerIdsSurvey =
            editOptionsSurvey?.activeServices.map((as) => as) || [];
        } else {
          // else the activeServices is an array of objects with "id" and "visibleForGroups"
          editLayerIdsSurvey =
            editOptionsSurvey?.activeServices.map((as) => as.id) || [];
        }
      }
    }

    // Ensure that the WFST layer that is used by the Collector plugin is added too.
    // This one differs a bit from the previous washes as there is no need to map
    // an Array: the `serviceId` is just a string as Collector only supports one
    // edit service at a time.
    const collectorToolsServiceId = mapConfig.tools.find(
      (t) => t.type === "collector"
    )?.options.serviceId;

    // We utilize Set to get rid of potential duplicates in the final list
    const uniqueLayerIds = new Set([
      ...baseLayerIds,
      ...layerIds,
      ...searchLayerIds,
      ...editLayerIds,
      ...editLayerIdsSurvey,
      ...(collectorToolsServiceId ? [collectorToolsServiceId] : []), // Conditional spread to avoid undefined inside the Set
    ]);

    // Prepare a new layers config object that will hold all keys
    // from the original object, but the values are empty arrays.
    const streamlinedLayersConfig = {};
    for (let key of Object.keys(layersConfig)) {
      streamlinedLayersConfig[key] = [];
    }

    // Loop the layersConfig and see if current layer exists in our Set.
    // If it does, push it into our duplicate.
    Object.keys(layersConfig).forEach((type) => {
      layersConfig[type].forEach((layer) => {
        // If layer ID exists in the Set, push layer object
        // into the collection that will be returned.
        uniqueLayerIds.has(layer.id) &&
          streamlinedLayersConfig[type].push(layer);
      });
    });

    return streamlinedLayersConfig;
  }
  /**
   * @summary Gets the map config, together with all needed layers and list of
   * user specific maps.
   *
   * @description This is the main endpoint of V2 of this API. In V1 client did
   * 3 requests that could have been (and now has been) consolidated into one:
   * - map config
   * - the entire layers store (with both used and unused layers)
   * - list of user specific maps
   *
   * This was less than ideal. The new way to do this is simple: take a look inside
   * the map config, determine which layers are needed, grab them, check if user
   * specific maps are needed, if so, grab the list too, pack everything into one
   * object and return it to the client.
   *
   * @param {string} map The map file to be retrieved
   * @param {string | undefined} user The ID of user that makes request - if auth is active
   * @param {boolean} [washContent=true] Determines whether the permission restrictions will be respected
   * @returns {object} An object with layers config, map config and a list of user specific maps.
   * @memberof ConfigServiceV2
   */
  async getMapWithLayers(map, user, washContent = true) {
    logger.trace(
      "[getMapWithLayers] invoked with 'washContent=%s' for user %s. Grabbing '%s' map config and all layers.",
      washContent,
      user,
      map
    );

    try {
      if (map === "layers")
        throw new Error(
          `"layers" is not a valid map config name. It looks like you are trying to access a v1 endpoint on the v2 API. Try adding "experimentalNewApi": true to Client's appConfig.json.`
        );
      // First, let's get the map config. From there we will be able
      // to figure out which layers are needed, and if UserSpecificMaps
      // should be present.
      const mapConfig = await this.getMapConfig(map, user, washContent);
      if (mapConfig.error) throw mapConfig.error;

      const layersStore = await this.getLayersStore(user, true);
      if (layersStore.error) throw layersStore.error;
      // Invoke the "cleaner" helper, expect only used layers in return.
      const layersConfig = this.#removeUnusedLayersFromStore(
        mapConfig,
        layersStore
      );

      // Next, take a look in LayerSwitcher.options and see
      // whether user specific maps are needed. If so, grab them.
      let userSpecificMaps = []; // Set to empty array, client will do .map() on it.
      if (mapConfig.map.mapselector === true) {
        userSpecificMaps = await this.getUserSpecificMaps(user);
      }

      // Finally, if we're running with authentication on, let's send
      // some user details to the client.
      let userDetails = undefined;
      if (user !== undefined && process.env.AD_EXPOSE_USER_OBJECT === "true") {
        if (
          process.env.AD_USE_GROUPS_FROM_HEADER === "true" &&
          ad.getUserDetails
        ) {
          // This is the Header based approach which has support for user, group and email.
          userDetails = await ad.getUserDetails(user);
        } else {
          // This is the default behavior with the ldap approach.
          userDetails = await ad.findUser(user);
        }
      }

      return { mapConfig, layersConfig, userSpecificMaps, userDetails };
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Determine whether a specified user has access to an object.
   *
   * @param {Array} visibleForGroups List of groups that have access, or empty if access unrestricted
   * @param {*} user User ID
   * @param {*} identifier Some ID of the entity to be filtered (e.g. tool name or layer ID). Used for meaningful logging.
   * @returns {boolean}
   * @memberof ConfigService
   */
  async filterByGroupVisibility(visibleForGroups, user, identifier) {
    if (!Array.isArray(visibleForGroups) || visibleForGroups.length === 0) {
      // If no restrictions are set, allow access
      logger.trace(
        "[filterByGroupVisibility] Access to %s unrestricted",
        identifier
      );
      return true;
    } else {
      // There are tools restrictions.
      logger.trace(
        "[filterByGroupVisibility] Only the following groups have access to %s: %o",
        identifier,
        visibleForGroups
      );

      // See if user is member of any of the specified groups.
      for (const group of visibleForGroups) {
        const isMember = await ad.isUserMemberOf(user, group);

        // If membership found, return true - no need to keep looping
        if (isMember === true) {
          logger.trace(
            "[filterByGroupVisibility] Access to %s gained for user %o",
            identifier,
            user
          );
          return true;
        }
      }
    }

    // If we got this far restrictions are set but user isn't member
    // in any of the specified groups.
    logger.debug(
      "[filterByGroupVisibility] Access to %s not allowed for user %o",
      identifier,
      user
    );

    return false;
  }

  /**
   * @summary Take a map config as JSON object and return
   * only those parts of that the current user has access to.
   *
   * @description The following content will be washed:
   *  - Part 1: tools (access to each of them can be restricted)
   *  - Part 2: groups and layers (in LayerSwitcher's options)
   *  - Part 3: WFS search services (in Search's options)
   *  - Part 4: WFST edit services (in Edit's options)
   *  - Part 4.1: WFST edit services (in Survey's options)
   *
   * @param {*} mapConfig
   * @param {*} user
   * @returns
   * @memberof ConfigService
   */
  async washMapConfig(mapConfig, user) {
    // Helper function that will call itself recursively.
    // Necessary to handle the nested tree of groups from LayerSwitcher config.
    const recursivelyWashGroups = async (groups) => {
      // Make sure that we can iterate 'groups', if not, exit.
      if (Symbol.iterator in Object(groups) === false) return [];

      // Looks like we've got an array and we must take
      // a look into each one of them separately.
      for (const group of groups) {
        // Notice that we modify the groups array in place!
        // Each group can have layers, take care of them. Remove any layers
        // to which user lacks access.
        if (Symbol.iterator in Object(group.layers)) {
          group.layers = await asyncFilter(
            // Overwrite the previous value of layers property with return value
            group.layers, // Array to be modified
            async (layer) =>
              await this.filterByGroupVisibility(
                layer.visibleForGroups,
                user,
                `layer "${layer.id}"`
              )
          );
        }

        // Now, recursively take care of groups
        if (Symbol.iterator in Object(group.groups)) {
          group.groups = await recursivelyWashGroups(group.groups);
        }
      }

      return groups;
    };

    logger.trace("[washMapConfig] Washing map config for %s", user);

    // Part 1: Remove those tools that user lacks access to
    mapConfig.tools = await asyncFilter(
      mapConfig.tools,
      async (tool) =>
        await this.filterByGroupVisibility(
          tool.options.visibleForGroups,
          user,
          `plugin "${tool.type}"`
        ) // Call the predicate
    );

    // Filter out nested visibleForGroups within tool options.
    const userGroups = await ad.getGroupMembershipForUser(user);

    for (const toolRef in mapConfig.tools) {
      const options = mapConfig.tools[toolRef].options;
      for (const optionRef in options) {
        const groups =
          options[optionRef] && typeof options[optionRef] === "object"
            ? options[optionRef]?.visibleForGroups
            : null;
        if (groups && groups.length > 0) {
          const accessGranted = groups.some((group) => {
            if (userGroups.indexOf(group) > -1) {
              return true;
            }
          });

          if (!accessGranted) {
            delete mapConfig.tools[toolRef].options[optionRef];
          }
        }
      }
    }

    // Part 2: Remove groups/layers/baselayers that user lacks access to
    const lsIndexInTools = mapConfig.tools.findIndex(
      (t) => t.type === "layerswitcher"
    );

    if (lsIndexInTools !== -1) {
      let { baselayers, groups } = mapConfig.tools[lsIndexInTools].options;

      // Wash baselayers
      baselayers = await asyncFilter(
        baselayers,
        async (baselayer) =>
          await this.filterByGroupVisibility(
            baselayer.visibleForGroups,
            user,
            `baselayer "${baselayer.id}"`
          )
      );

      // Put back the washed baselayers into config
      mapConfig.tools[lsIndexInTools].options.baselayers = baselayers;

      // Take care of recursively washing groups too, and put back the results to config
      groups = await recursivelyWashGroups(groups);
      mapConfig.tools[lsIndexInTools].options.groups = groups;
    }

    // Part 3: Wash WFS search services
    const searchIndexInTools = mapConfig.tools.findIndex(
      (t) => t.type === "search"
    );

    if (searchIndexInTools !== -1) {
      let { layers } = mapConfig.tools[searchIndexInTools].options;

      // Wash WFS search layers
      layers = await asyncFilter(
        layers,
        async (layer) =>
          await this.filterByGroupVisibility(
            layer.visibleForGroups,
            user,
            `WFS search layer "${layer.id}"`
          )
      );
      mapConfig.tools[searchIndexInTools].options.layers = layers;
    }

    // Part 4: Wash WFST edit services
    const editIndexInTools = mapConfig.tools.findIndex(
      (t) => t.type === "edit"
    );

    if (editIndexInTools !== -1) {
      let { activeServices } = mapConfig.tools[editIndexInTools].options;
      // Wash WFST edit layers
      activeServices = await asyncFilter(
        activeServices, // layers in edit tool are named activeServices
        async (layer) =>
          await this.filterByGroupVisibility(
            layer.visibleForGroups,
            user,
            `WFST edit layer "${layer.id}"`
          )
      );

      mapConfig.tools[editIndexInTools].options.activeServices = activeServices;
    }

    // Part 4.1: Wash WFST survey services
    const editIndexInToolsSurvey = mapConfig.tools.findIndex(
      (t) => t.type === "survey"
    );

    if (editIndexInToolsSurvey !== -1) {
      let { activeServices } = mapConfig.tools[editIndexInToolsSurvey].options;
      // Wash WFST edit layers
      activeServices = await asyncFilter(
        activeServices, // layers in edit tool are named activeServices
        async (layer) =>
          await this.filterByGroupVisibility(
            layer.visibleForGroups,
            user,
            `WFST edit layer "${layer.id}"`
          )
      );
      mapConfig.tools[editIndexInToolsSurvey].options.activeServices =
        activeServices;
    }

    // Part 5: Wash FME-server products
    const fmeServerIndexInTools = mapConfig.tools.findIndex(
      (t) => t.type === "fmeServer"
    );

    if (fmeServerIndexInTools !== -1) {
      // The FME-server tool got a bunch of products, and each one of them
      // can be controlled to be visible only for some groups.
      let { products } = mapConfig.tools[fmeServerIndexInTools].options;
      // So let's remove the products that the current user does not have
      // access to.
      products = await asyncFilter(
        products,
        async (product) =>
          await this.filterByGroupVisibility(
            product.visibleForGroups,
            user,
            `FME-server product "${product.name}"`
          )
      );
      // And then update the mapConfig with the products.
      mapConfig.tools[fmeServerIndexInTools].options.products = products;
    }

    return mapConfig;
  }

  async getLayersStore(user, washContent = true) {
    logger.trace("[getLayersStore] for user %o", user);
    try {
      const pathToFile = path.join(process.cwd(), "App_Data", `layers.json`);
      const text = await fs.promises.readFile(pathToFile, "utf-8");
      const json = await JSON.parse(text);

      if (text.error) throw text.error;
      if (json.error) throw json.error;

      // TODO:
      // /config/layers should be way smarter than it is today. We should modify client
      // so that we fetch mapconfig and layers at the same time. This way, we would be
      // able to find out which layers are necessary to be returned from the store for
      // current map. This would obviously lead to drastically smaller response, but
      // also be a security measure, as user would not be able to find out which layers
      // exist in the store.

      if (washContent === false) {
        logger.trace(
          "[getLayersStore] invoked with 'washContent=false'. Returning the entire contents of layers store."
        );
        return json;
      }

      // If we haven't enabled AD restrictions, just return the entire layers store
      if (process.env.AD_LOOKUP_ACTIVE !== "true") {
        logger.trace(
          "[getLayersStore] AD auth disabled. Returning the entire contents of layers store."
        );
        return json;
      }

      // Else, it looks like MapService is configured to respect AD restrictions.
      // We must do some extra work and remove layers that current user should
      // see before we can return the contents of map config.

      // First, ensure that we have a valid user name. This is necessary for AD lookups.
      if ((await ad.isUserValid(user)) !== true) {
        const e = new Error(
          "[getLayersStore] AD authentication is active, but supplied user name could not be validated. Please check logs for any errors regarding connectivity problems with ActiveDirectory."
        );
        logger.error(e.message);
        throw e;
      }

      // TODO:  Currently there is no option in admin to set permission on a per-layer-basis,
      // but eventually it should be there. This means that we should write some washing function
      // and replace the return below with something like this:
      // return this.washLayersStore(json);
      return json;
    } catch (error) {
      return { error };
    }
  }

  async #verifyOWSLayers({ type, layers }) {
    const missingLayers = [];
    const errors = [];

    // We want to group layers by service URL. This object will keep track.
    const getCapabilitiesUrls = {};

    // Now, iterate the layers and group by URL to service
    layers.forEach((l) => {
      if (!Object.hasOwn(getCapabilitiesUrls, l.url)) {
        // First time we encounter a given URL, we must create the property
        getCapabilitiesUrls[l.url] = [
          {
            id: l.id,
            caption: l.caption,
            layers: [...l.layers],
          },
        ];
      } else {
        // If URL already exists as property, just push into existing array
        getCapabilitiesUrls[l.url].push({
          id: l.id,
          caption: l.caption,
          layers: [...l.layers],
        });
      }
    });

    // For each of the URLs…
    for (const [url, layersObject] of Object.entries(getCapabilitiesUrls)) {
      // … check if the URL already contains "?". If so, we want to append
      // our remaining URL params.
      const glue = url.includes("?") ? "&" : "?";

      // Next, prepare the URL that we will fetch in order to GetCapabilities.
      // This differs a little, depending on if it's WMS or WFS.
      let params = {};
      switch (type) {
        case "wms":
          params = {
            SERVICE: "WMS",
            VERSION: "1.3.0",
            REQUEST: "GetCapabilities",
          };
          break;
        case "wfs":
          params = {
            SERVICE: "WFS",
            VERSION: "2.0.0",
            REQUEST: "GetCapabilities",
          };
          break;

        default:
          throw "Unknown OWS type provided";
      }
      const getCapabilitiesUrl = url + glue + new URLSearchParams(params);

      // A slight delay - too many requests to the same server can cause a block
      await delay(100);

      let response,
        text,
        json = "";
      try {
        // Go fetch
        response = await fetch(getCapabilitiesUrl);

        // Ensure that we got a correct response.
        if (response.status !== 200) {
          throw new Error(
            `Error: expected response status 200. Got ${response.status}.`
          );
        } else {
          // If the response was OK, we expect XML.
          // Let's parse response as text…
          text = await response.text();
          // …next, let's parse the XML itself.
          json = this.xmlParser.parse(text);
        }
      } catch (error) {
        // We want to display all errors that ocurred during the loop,
        // so we push this one to the array that will be appended to the
        // response.
        errors.push({
          url: getCapabilitiesUrl,
          message: error?.cause?.toString() || error.message,
        });

        // In addition (and this is important!), we skip the remaining code
        // (by continuing the for-loop). If we didn't get the expected response,
        // we don't have anything to compare our layers against - so there's no
        // need to do it. The results would be misleading.
        continue;
      }

      // If we got this far, it means that fetching and parsing were successful.

      // The parsed response will contain service's available layers.
      // Let's prepare a simple array (of strings) that will contain
      // layer names that exist on this given WMS service.
      let layersFromGetCapabilities = "";

      // Depending on OWS service type (WMS or WFS), the actual layers will be
      // found in slightly different locations in the response.
      switch (type) {
        case "wms":
          layersFromGetCapabilities =
            json?.WMS_Capabilities?.Capability?.Layer?.Layer?.map?.(
              (l) => l.Name
            );
          break;
        case "wfs":
          layersFromGetCapabilities = json?.[
            "wfs:WFS_Capabilities"
          ]?.FeatureTypeList?.FeatureType?.map?.((l) => l.Name);
          break;

        default:
          throw "Unknown OWS type provided";
      }

      // Compare reportedly existing layers with those from Hajk's repository
      const missing = await Promise.allSettled(
        layersObject.map(async (l) => {
          // Filter the array by saving all layers that do not exist in GetCapabilities
          const missingLayers = l.layers.filter(
            (x) => !layersFromGetCapabilities?.includes(x)
          );

          // If we found something…
          if (missingLayers.length > 0) {
            // …ensure that the layer is really missing. We can have false positives
            // here, because layers can be available but _not_ announced by the OWS service.
            const problematic = [];

            const reallyMissingLayers = await Promise.allSettled(
              missingLayers.map(async (ml) => {
                let describeParams = {};
                switch (type) {
                  case "wms":
                    describeParams = {
                      SERVICE: "WMS",
                      VERSION: "1.1.1",
                      SLD_VERSION: "1.1.0",
                      REQUEST: "DescribeLayer",
                      LAYERS: ml,
                    };
                    break;
                  case "wfs":
                    describeParams = {
                      SERVICE: "WFS",
                      VERSION: "1.1.1",
                      REQUEST: "DescribeFeatureType",
                      TYPENAME: ml,
                    };
                    break;

                  default:
                    break;
                }

                const describeLayerUrl =
                  url + glue + new URLSearchParams(describeParams);

                const response = await fetch(describeLayerUrl);

                if (response.status !== 200) {
                  errors.push({
                    url: describeLayerUrl,
                    message: `Error: expected response status 200. Got ${response.status}.`,
                  });
                  return ml;
                } else {
                  try {
                    const text = await response.text();
                    const xml = this.xmlParser.parse(text);

                    // If XML does not contain any of the following:
                    if (
                      !Object.hasOwn(xml, "WMS_DescribeLayerResponse") && // GeoServer WMS
                      !Object.hasOwn(xml, "DescribeLayerResponse") && // QGIS Server WMS
                      !Object.hasOwn(xml, "xsd:complexType") && // GeoServer WFS
                      !Object.hasOwn(xml, "complexType") // QGIS Server WFS
                    ) {
                      // … we can consider the layer missing (hence return it back to the missing array).
                      return ml;
                    } else {
                      // Else, the layer seems OK according to DescribeLayer, but it did not
                      // show up in GetCapabilities. This can be fully legit (i.e. layer not announced).
                      // But it can also mean that there are other problems. Therefore, it's nice to collect
                      // those problematic layers and return them as well.
                      problematic.push({
                        describeLayerUrl,
                        layer: ml,
                      });
                      // Return a null value so we can wash the array further on.
                      return null;
                    }
                  } catch (error) {
                    // Push any errors to the errors array…
                    errors.push({
                      url: describeLayerUrl,
                      message: error?.cause?.toString() || error.message,
                    });
                    // …and return null so we can wash empty values from the array.
                    return null;
                  }
                }
              })
            );
            // …prepare a nice return object that contains some
            // handy properties (e.g. layer ID and caption).
            return {
              hajkCaption: l.caption,
              hajkLayerId: l.id,
              getCapabilitiesUrl,
              missing: reallyMissingLayers.flatMap(
                // flatMap will wash the array of Promises and extract
                // only those with a value (removing empty elements from the array)
                ({ value }) => (value === null ? [] : value) // Remember: returning an empty array from flatMap removes the element.
              ),
              problematic,
            };
          } else {
            return null;
          }
        })
      );

      // Final filter to "remove" empty entries: we'll have an element for each
      // settled promise, but we're only interested in those with a "value" property.
      const washedMissingLayers = missing.flatMap(({ value }) =>
        value === null ? [] : value
      );

      // Push only if we've got any missing layers
      washedMissingLayers.length > 0 &&
        missingLayers.push({
          url,
          hajkLayers: washedMissingLayers,
        });
    }

    return { services: missingLayers, errors };
  }

  async verifyLayers(user) {
    logger.info("[verifyLayers] invoked by user %s", user);

    try {
      if (typeof fetch !== "function") {
        throw new Error(
          `Function not supported. Please update your NodeJS runtime to at least v18.0.0. Current Node version: ${process.version}.`
        );
      }
      // Read the JSON layers store without any restrictions (hence the parameters)
      const layers = await this.getLayersStore(false, false);

      // Extract layer stores that will be checked
      const { wmslayers, wfslayers } = layers;

      // Check WMS layers
      const missingWMSLayers = await this.#verifyOWSLayers({
        type: "wms",
        layers: wmslayers,
      });

      // Check WFS layers
      const missingWFSLayers = await this.#verifyOWSLayers({
        type: "wfs",
        layers: wfslayers,
      });

      logger.info("[verifyLayers] ended with a successful response");
      return { wms: missingWMSLayers, wfs: missingWFSLayers };
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Export baselayers, groups, and layers from a map configuration
   * to the specified format (currently only JSON is supported, future options
   * could include e.g. XLSX).
   *
   * @param {string} [map="layers"] Name of the map to be explained
   * @param {string} [format="json"] Desired output format
   * @param {*} next Callback, contain error object
   * @returns Human-friendly description of layers used in the specified map
   * @memberof ConfigService
   */
  async exportMapConfig(map = "layers", format = "json", user) {
    try {
      // Obtain layers definition as JSON. It will be needed
      // both if we want to grab all available layers or
      // describe a specific map config.
      const layersConfig = await this.getLayersStore(user);

      // Create a Map, indexed with each map's ID to allow
      // fast lookup later on
      const layersById = new Map();

      // Populate the Map so we'll have {layerId: layerCaption}
      for (const type in layersConfig) {
        layersConfig[type].map((layer) =>
          layersById.set(layer.id, {
            name: layer.caption,
            ...(layer.layers &&
              layer.layers.length > 1 && { subLayers: layer.layers }),
          })
        );
      }

      // If a list of all available layers was requested, we're
      // done here and can return the Map.
      if (map === "layers") return Object.fromEntries(layersById); // TODO: Perhaps sort on layer name?

      // If we got this far, we now need to grab the contents of
      // the requested map config. Note that content washing is disabled:
      // we will export the entire map config as-is.
      const mapConfig = await this.getMapConfig(map, user, false);

      // Reading map config can fail, e.g. the file can be missing
      if (mapConfig.error) {
        throw new Error(mapConfig.error);
      }

      // Grab LayerSwitcher's setup
      const { groups, baselayers } = mapConfig.tools.find(
        (tool) => tool.type === "layerswitcher"
      ).options;

      // Define a recursive function that will grab contents
      // of a group (and possibly all groups beneath).
      const decodeGroup = (group) => {
        const g = {};
        // First grab current group's name
        if (group.name) g.name = group.name;

        // Next assign names to all layers
        if (Array.isArray(group.layers))
          g.layers = group.layers.map((l) => layersById.get(l.id));

        // Finally, go recursive if there are subgroups
        if (group.groups && group.groups.length !== 0) {
          g.groups = group.groups.map((gg) => decodeGroup(gg));
        }

        return g;
      };

      // Prepare the object that will be returned
      const output = {
        baselayers: [],
        groups: [],
      };

      // Grab names for base layers and put into output
      baselayers.map((l) => output.baselayers.push(layersById.get(l.id)));

      // Take all groups and call our decode method on them
      output.groups = groups.map((group) => decodeGroup(group));

      if (format === "json") return output;

      // Throw error if output is not yet implemented
      throw new Error(`Output format ${format} is not implemented.`);
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary List all available map configurations files
   *
   * @returns
   * @memberof ConfigService
   */
  async getAvailableMaps() {
    logger.trace("[getAvailableMaps] invoked");
    try {
      const dir = path.join(process.cwd(), "App_Data");
      // List dir contents, the second parameter will ensure we get Dirent objects
      const dirContents = await fs.promises.readdir(dir, {
        withFileTypes: true,
      });
      const availableMaps = dirContents
        .filter(
          (entry) =>
            // Filter out only files (we're not interested in directories).
            entry.isFile() &&
            // Filter out the special case, layers.json file.
            entry.name !== "layers.json" &&
            // Only JSON files
            entry.name.endsWith(".json")
        )
        // Create an array using name of each Dirent object, remove file extension
        .map((entry) => entry.name.replace(".json", ""));
      return availableMaps;
    } catch (error) {
      return { error };
    }
  }

  async getUserSpecificMaps(user) {
    logger.trace("[getUserSpecificMaps] for %o", user);
    try {
      // Prepare our return array
      const output = [];

      // Grab all map configs
      const availableMaps = await this.getAvailableMaps();

      // Open each of these map configs to see if it wants to be exposed
      // in MapSwitcher, and to see what name it wishes to have.
      for (const map of availableMaps) {
        // Open map config and parse it to a JSON object. Notice that
        // we getMapConfig will return only those maps that current
        // user has access to, so there's no need to "wash" the result
        // later on.
        const mapConfig = await this.getMapConfig(map, user);

        // If we encounter errors, access to current map is restricted for current user
        // so let's just continue with next element in available maps.
        if (mapConfig.error) continue;

        // If we got this far, user seems to have access to map config.

        // The relevant settings will be found in LayerSwitcher config
        const lsConfig = mapConfig.tools.find(
          (t) => t.type === "layerswitcher"
        );

        // If map config says it's configured to be exposed in MapSwitcher,
        // push the current map into the return object.
        if (lsConfig?.options.dropdownThemeMaps === true) {
          output.push({
            mapConfigurationName: map,
            mapConfigurationTitle: lsConfig.options.themeMapHeaderCaption,
          });
        }
      }
      return output;
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Duplicate a specified map
   *
   * @param {*} src Map to be duplicated
   * @param {*} dest Name of the new map, the duplicate
   * @returns
   * @memberof ConfigService
   */
  async duplicateMap(src, dest) {
    try {
      let srcPath = null;

      if (src.endsWith(".template")) {
        // If src ends with ".template", don't add the .json file extension,
        // and look inside /templates directory.
        srcPath = path.join(process.cwd(), "App_Data", "templates", src);
      } else {
        // Else it's a regular JSON file, add the extension and look in App_Data only
        srcPath = path.join(process.cwd(), "App_Data", src + ".json");
      }

      // Destination will always need the extension added
      const destPath = path.join(process.cwd(), "App_Data", dest + ".json");

      // Copy!
      await fs.promises.copyFile(srcPath, destPath);
      // Sending a valid object will turn it into JSON which in turn will return
      // status 200 and that empty object. I know it's not the best way and we
      // should be more explicit about successful returns than just an empty object…
      return {};
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Create a new map, using supplied name, but duplicating the default map template
   *
   * @param {*} name Name given to the new map
   * @memberof ConfigService
   */
  async createNewMap(name) {
    return this.duplicateMap("map.template", name);
  }

  /**
   * @summary Delete a map configuration
   *
   * @param {*} name Map configuration to be deleted
   * @memberof ConfigService
   */
  async deleteMap(name) {
    try {
      // Prepare path
      const filePath = path.join(process.cwd(), "App_Data", name + ".json");
      await fs.promises.unlink(filePath);
      return {};
    } catch (error) {
      return { error };
    }
  }
}

export default new ConfigServiceV2();
