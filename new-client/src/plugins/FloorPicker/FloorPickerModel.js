import { EXAMPLE_FLOOR_CONFIG } from "./DefaultConfig";
import { functionalOk as functionalCookieOk } from "./../../models/Cookie";
import LocalStorageHelper from "./../../utils/LocalStorageHelper";

export default class FloorPickerModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.floorConfig = settings.options?.floorConfig ?? EXAMPLE_FLOOR_CONFIG;
    this.filteredLayers = [];
    this.initialized = false;
    this.floorLimits = { top: 100, bottom: -100 };
  }

  init = () => {
    this.#sortFloorConfig();
    this.floorLimits = {
      top: this.floorConfig[0].floorLevel,
      bottom: this.floorConfig[this.floorConfig.length - 1].floorLevel,
    };

    let layersToFilter = this.#getAffectedLayers();
    //the floorPicker tool is going to add CQL filters to layers in order to filter the map by a value (in this case, a certain floor).
    //here, we save the original CQL filter values of the affected layers, so that we can reset them when we close the tool.
    layersToFilter.forEach((l) => {
      let originalCQL = l.getSource().getParams().CQL_FILTER;
      this.filteredLayers.push({ layer: l, originalCQL: originalCQL });
    });

    //setting initialized to true will cause the effect on the view to re-run and do the first actual filtering, as this time the initialized check will pass.
    this.initialized = true;
  };

  // We need to reset (remove the filters) when we close the tool.
  reset = () => {
    // Remove the CQL filter from the layers that we added it to.
    this.filteredLayers.forEach((l) => {
      if (l.originalCQL) {
        l.layer.getSource().updateParams({ CQL_FILTER: l.originalCQL });
      } else {
        //If the layer didn't originally have a CQL_FILTER parameters, we can remove the parameter that we added.
        let params = l.layer.getSource().getParams();
        delete params.CQL_FILTER;
        l.layer.getSource().updateParams({ ...params });
      }
    });

    // Remove the global filter from localStorage (thereby resetting it for search and other tools that may look for it there).
    LocalStorageHelper.set("globalMapState", null);

    // Reset the filtered layers
    this.filteredLayers = [];
    this.initialized = false;
  };

  getDefaultFloor = () => {
    let defaultFloor = this.floorConfig.find((f) => f.default === true);
    return defaultFloor ? defaultFloor : this.floorConfig[0];
  };

  // Sort the floor config by the floor level. We put the highest floor first, as it makes more visual sense in the dropdown list.
  #sortFloorConfig = () => {
    this.floorConfig.sort((a, b) => {
      return a.floorLevel < b.floorLevel ? 1 : -1;
    });
  };

  #getAffectedLayers = () => {
    const filterLayers = [];
    const floorPickerLayerIds = [];

    this.options.activeLayers.forEach((layer) =>
      floorPickerLayerIds.push(layer.id)
    );

    this.map
      .getLayers()
      .getArray()
      .forEach((layer) => {
        //The layer property 'name' is the layer id from the layersconfig.
        if (floorPickerLayerIds.includes(layer.getProperties().name)) {
          filterLayers.push(layer);
        }
      });

    return filterLayers;
  };

  #applyFilterToLayers = (layers, cqlFilter) => {
    layers.forEach((l) => {
      //Add the new CQL filter to the layer - Hajk will automatically reload the layer with the new params.
      l.getSource().updateParams({ CQL_FILTER: cqlFilter });
    });
  };

  #updateFilterInStorage = (cqlFilter, filterPropertyName, floor) => {
    const floorPickerLayerIds = [];
    this.options.activeLayers.forEach((layer) =>
      floorPickerLayerIds.push(layer.id)
    );

    if (functionalCookieOk()) {
      LocalStorageHelper.set("globalMapState", {
        mapFilter: {
          filter: cqlFilter,
          filterProperty: filterPropertyName,
          filterValue: floor.floorId,
          filterLayers: floorPickerLayerIds,
        },
        mapProperties: {
          levelId: floor.floorId,
          Level_Name: floor.floorValue,
        },
      });

      // Tell the globalObserver that we have updated this, we may need to respond (for example within the LayerSettings CQLFilter.js)
      // although nothing responds at the moment.
      this.app.globalObserver.publish("layerswitcher.updateCQLFilter");
    }
  };

  // Create a CQL filter based on properties from the Floorpicker tool config.
  // Apply the filter to the layers specified in the tool config.
  // Add the filter (and parameters needed to create an OpenLayers filter) onto LocalStorage, to be available for other tools
  // that need to be aware if a global map filter is being used.
  filterMapByFloor = (floor) => {
    const filterPropertyName = this.options.filterPropertyName;
    const filterValue = floor.floorId;
    const cqlFilter = `${filterPropertyName} = ${filterValue}`;

    // TODO: make 'layersToFilter' this more efficient - we shouldn't need to do this every time we filter, only once as it comes from the
    // config and will never change.
    const layersToFilter = this.#getAffectedLayers();

    this.#applyFilterToLayers(layersToFilter, cqlFilter);
    this.#updateFilterInStorage(cqlFilter, filterPropertyName, floor);
  };
}
