import MapClickModel from "../MapClickModel";
import { bindMapClickEvent } from "../Click";

/**
 * Wires up the two possible infoclick handling paths (new MapClickModel or legacy
 * bindMapClickEvent) based on the config. Preserves the existing FIXME comment.
 *
 * @param {object} appModel - The AppModel instance (provides map and globalObserver)
 * @param {object} config - The translated map config (result of translateConfig)
 */
export function attachInfoclickHandlers(appModel, config) {
  const infoclickOptions = config.tools.find(
    (t) => t.type === "infoclick"
  )?.options;

  if (infoclickOptions?.useNewInfoclick === true) {
    const mapClickModel = new MapClickModel(
      appModel.map,
      appModel.globalObserver,
      infoclickOptions
    );

    mapClickModel.bindMapClick((featureCollections) => {
      const featureCollectionsToBeHandledByMapClickViewer =
        featureCollections.filter((fc) => fc.type !== "SearchResults");

      // Publish the retrieved collections, even if they're empty. We want the
      // handling components to know, so they can act accordingly (e.g. close
      // window if no features are to be shown).
      appModel.globalObserver.publish(
        "mapClick.featureCollections",
        featureCollectionsToBeHandledByMapClickViewer
      );

      // Next, handle search results features.
      // Check if we've got any features from the search layer,
      // and if we do, announce it to the search component so it can
      // show relevant feature in the search results list.
      const searchResultFeatures = featureCollections.find(
        (c) => c.type === "SearchResults"
      )?.features;

      if (searchResultFeatures?.length > 0) {
        appModel.globalObserver.publish(
          "infoClick.searchResultLayerClick",
          searchResultFeatures // Clicked features sent to the search-component for display
        );
      }
    });
  }

  // FIXME: Potential miss here: don't we want to register click on search results
  // But we register the Infoclick handler only if the plugin exists in map config:
  // even if Infoclick plugin is inactive? Currently search won't register clicks in
  // map without infoclick, which seems as an unnecessary limitation.
  if (
    config.tools.some((tool) => tool.type === "infoclick") &&
    infoclickOptions?.useNewInfoclick !== true
  ) {
    bindMapClickEvent(appModel.map, (mapClickDataResult) => {
      // We have to separate features coming from the searchResult-layer
      // from the rest, since we want to render this information in the
      // search-component rather than in the featureInfo-component.
      const searchResultFeatures = mapClickDataResult.features.filter(
        (feature) => {
          return feature?.layer.get("name") === "pluginSearchResults";
        }
      );
      const infoclickFeatures = mapClickDataResult.features.filter(
        (feature) => {
          return feature?.layer.get("name") !== "pluginSearchResults";
        }
      );

      // If there are any results from search layer, send an event about that.
      if (searchResultFeatures.length > 0) {
        appModel.globalObserver.publish(
          "infoClick.searchResultLayerClick",
          searchResultFeatures // Clicked features sent to the search-component for display
        );
      }

      // Do the same for regular infoclick results from WMS layers
      if (infoclickFeatures.length > 0) {
        // Note that infoclick.mapClick seems to have a different interface…
        appModel.globalObserver.publish("infoClick.mapClick", {
          ...mapClickDataResult, // as it requires the entire object, not just "features", like infoClick.searchResultLayerClick.
          features: infoclickFeatures, // Hence, we send everything from mapClickDataResult, but replace the features property.
        });
      }
    });
  }
}
