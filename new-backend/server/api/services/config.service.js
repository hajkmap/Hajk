import fs from "fs";
import path from "path";
import ad from "./activedirectory.service";
import asyncFilter from "../utils/asyncFilter";
import log4js from "log4js";
import getAnalyticsOptionsFromDotEnv from "../utils/getAnalyticsOptionsFromDotEnv";

const logger = log4js.getLogger("service.config");

class ConfigService {
  constructor() {
    // TODO: As reading files is expansive, we can read all
    // JSON files on init and keep then in-memory. Subsequent
    // reads will be served from this in-memory store.
    // We should also implement an update-store method, perhaps
    // have a global bus (using EventEmitter?), so we can trigger
    // re-reads from FS into our in-memory store.
    logger.trace("Initiating ConfigService");
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

      // Tell the API version
      json.version = 1;

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
        const e = new Error(
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
        const e = new Error(
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
   * only those parts of it that the current user has access to.
   *
   * @description The following content will be washed:
   *  - Part 1: tools (access to each of them can be restricted)
   *  - Part 2: groups and layers (in LayerSwitcher's options)
   *  - Part 3: WFS search services (in Search's options)
   *  - Part 4: WFST edit services (in Edit's options)
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
      // Expect that we got an array of objects, and we must take
      // a look into each one of them separately.
      for (const group of groups) {
        // Notice that we modify the groups array in place!
        // Each group can have layers, take care of them. Remove any layers
        // to which user lacks access.
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

        // Now, recursively take care of groups
        group.groups = await recursivelyWashGroups(group.groups);
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
  async exportMapConfig(map = "layers", format = "json", user, next) {
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

    // Some clumsy error handling
    if (mapConfig.error) {
      next(mapConfig.error);
      return;
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
    next(Error(`Output format ${format} is not implemented.`));
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

export default new ConfigService();
