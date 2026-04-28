import {
  parseGMLFeatures,
  parseGeoJsonFeatures,
  experimentalParseEsriWmsRawXml,
  parseWmsGetFeatureInfoXml,
} from "utils/wmsFeatureParsers";

import OlFeature from "ol/Feature";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";
import type { Coordinate } from "ol/coordinate";
import type OlMap from "ol/Map";
import type Layer from "ol/layer/Layer";
import type Source from "ol/source/Source";
import type { EventObserver } from "react-event-observer";
import type { ProjectionLike } from "ol/proj";
import type {
  PropertyCheckerModelSettings,
  GroupedFeatures,
  GroupedDigitalPlanFeatures,
  PaverkasAvEntry,
} from "./types";
import type { DrawModelInterface, HajkApp } from "../../types/hajk";

/** A WMS-capable layer with a getFeatureInfoUrl method on its source. */
interface WmsSource extends Source {
  getFeatureInfoUrl(
    coordinate: Coordinate,
    resolution: number,
    projection: ProjectionLike,
    params: Record<string, unknown>
  ): string | undefined;
}

export default class PropertyCheckerModel {
  #app: HajkApp;
  #checkLayerPropertyAttribute: string;
  #checkLayerAffectedByAttribute: string;
  #groupDigitalPlansLayerByAttribute: string;
  #groupDigitalPlansLayerSecondLevelByAttribute: string;
  #checkLayer: Layer<WmsSource> | undefined;
  #checkLayerId: string;
  #digitalPlansLayer: Layer<WmsSource> | undefined;
  #digitalPlansLayerId: string;
  #drawModel: DrawModelInterface;
  #localObserver: EventObserver;
  #map: OlMap;
  #viewResolution: number | undefined;
  #viewProjection: ProjectionLike;

  constructor(settings: PropertyCheckerModelSettings) {
    // Set some private fields
    this.#app = settings.app;
    this.#checkLayerPropertyAttribute = settings.checkLayerPropertyAttribute;
    this.#checkLayerAffectedByAttribute =
      settings.checkLayerAffectedByAttribute;
    this.#groupDigitalPlansLayerByAttribute =
      settings.groupDigitalPlansLayerByAttribute;
    this.#groupDigitalPlansLayerSecondLevelByAttribute =
      settings.groupDigitalPlansLayerSecondLevelByAttribute;
    this.#checkLayerId = settings.checkLayerId;
    this.#digitalPlansLayerId = settings.digitalPlansLayerId;
    this.#drawModel = settings.drawModel;
    this.#localObserver = settings.localObserver;
    this.#map = settings.map;
    this.#viewResolution = this.#map.getView().getResolution();
    this.#viewProjection = this.#map.getView().getProjection();

    this.#initSubscriptions(); // Initiate listeners on observer(s)

    // Finding the correct layer in our OL Map is an expensive operation. Let's do it once.
    this.#checkLayer = this.#getOlLayer(this.#checkLayerId);
    this.#digitalPlansLayer = this.#getOlLayer(this.#digitalPlansLayerId);
  }

  #getOlLayer = (layerId: string): Layer<WmsSource> | undefined => {
    try {
      const l = this.#map
        .getAllLayers()
        .find((l) => l.get("name") === layerId) as Layer<WmsSource> | undefined;
      if (l === undefined) {
        throw new Error(
          `PropertyChecker error: Couldn't find layer with ID ${layerId}. Please contact system administrator.`
        );
      }
      return l;
    } catch (error) {
      console.error((error as Error).message);
    }
    return undefined;
  };

  #getOlFeaturesForCoordsAndOlLayer = async (
    coords: Coordinate,
    olLayer: Layer<WmsSource> | undefined
  ): Promise<Feature<Geometry>[]> => {
    if (!olLayer) {
      console.error("PropertyChecker: Layer is undefined, cannot query.");
      return [];
    }

    // Ensure to grab the current zoom level's resolution
    this.#viewResolution = this.#map.getView().getResolution();
    const source = olLayer.getSource();
    if (!source) {
      console.error("PropertyChecker: Layer source is null.");
      return [];
    }

    const url = source.getFeatureInfoUrl(
      coords,
      this.#viewResolution!,
      this.#viewProjection,
      {
        INFO_FORMAT: "application/json",
        FEATURE_COUNT: 300, // Without this, only first feature is returned,
      }
    );

    if (!url) {
      console.error("PropertyChecker: Could not construct GetFeatureInfo URL.");
      return [];
    }

    const response = await fetch(url);

    // If the response succeeded…
    if (response.status === 200) {
      // …try to read the Content-Type header. We need it for parsing.
      const responseContentType = response.headers
        .get("content-type")
        ?.split(";")[0];

      // Prepare an object to hold the features to be parsed.
      let olFeatures: Feature<Geometry>[] = [];

      // Depending on the response type, parse accordingly
      switch (responseContentType) {
        case "application/geojson":
        case "application/json": {
          olFeatures = parseGeoJsonFeatures(await response.json());
          break;
        }
        case "text/xml": {
          olFeatures = parseWmsGetFeatureInfoXml(await response.text());
          break;
        }
        case "application/vnd.ogc.gml": {
          olFeatures = parseGMLFeatures(await response.text());
          break;
        }
        case "application/vnd.esri.wms_raw_xml": {
          olFeatures = experimentalParseEsriWmsRawXml(await response.text());
          break;
        }
        default:
          console.warn(
            "Unsupported response type for GetFeatureInfo request:",
            responseContentType
          );
          break;
      }
      return olFeatures;
    } else {
      // I'm adding this for pure readability. We don't want to throw any errors
      // here, even if one of the Promises was rejected. The reason is that throwing
      // an error here would abort the flow (by taking us straight to the catch() below).
      // In that case, we'd miss any successfully parsed responses, and we don't want that.
      // So we just go on, silently.
      console.error(
        "Couldn't parse GetFeatureInfo.",
        response.status,
        response.statusText
      );
      // Always return an array to prevent crash further on when we do .map()
      return [];
    }
  };

  // Sets up listeners on observers
  #initSubscriptions = () => {
    this.#localObserver.subscribe(
      "drawModel.featureAdded",
      this.#handleFeatureAdded
    );
  };

  #groupFeaturesByAttributeName = (
    features: Feature<Geometry>[],
    attributeName: string,
    addMarkerFeatureToMap = false
  ): GroupedFeatures => {
    // Features that arrive from the WMS service will be in a flat
    // array. For our use case, we want to group features that correspond
    // to a specific property. The attribute name that holds the properties
    // will however differ, between setups. So it's a Admin setting.
    //
    // Let's grab the attribute's name and loop through our results, pushing
    // each feature into a new object, one for each property.
    const groupedFeatures: GroupedFeatures = {};
    features.forEach((f: Feature<Geometry>) => {
      const identifier = f.get(attributeName) as string | undefined;
      if (identifier === undefined) {
        console.error(
          `Could not group by property due to tool misconfiguration: attribute "${attributeName}" does not exist.`
        );
        return;
      }
      // Ensure that we have a category to push into
      if (!Object.hasOwn(groupedFeatures, identifier)) {
        // Prepare an object that will contain to things:
        // - a markerFeature (used to visualize the affected geometry for the user)
        // - an array of actual features from which we'll display properties

        // First let's extract the first feature. We will use it to visualize
        // the affected area in map.
        const markerFeature = f;
        // We must add USER_DRAWN=true to "trick" DrawModel into thinking that
        // this feature was drawn by user and should be removed when we clean up.
        // Without this, drawModel.removeFeatures won't take care of this geometry.
        markerFeature.set("USER_DRAWN", true);

        // Check if we should add the marker feature to map. Don't send any events from DrawModel
        if (addMarkerFeatureToMap === true) {
          this.#drawModel.addFeature(markerFeature, { silent: true });
        }

        // Finally, initialize the object for the current identifier, don't add
        // any features to the features array yet (it'll be taken care of next).
        groupedFeatures[identifier] = {
          markerFeature: f,
          features: [],
        };
      }

      // Now when we know that we have a place to push features into, let's do it.
      groupedFeatures[identifier].features.push(f);
    });
    return groupedFeatures;
  };

  // Start with the flatArray and group it according to the value of one of
  // its properties. The exact value is admin-controllable.
  #groupedMap = (
    features: Feature<Geometry>[],
    attributeName: string
  ): Map<string, Feature<Geometry>[]> =>
    features.reduce(
      (entryMap, e) =>
        entryMap.set(e.get(attributeName) as string, [
          ...(entryMap.get(e.get(attributeName) as string) || []),
          e,
        ]),
      new Map<string, Feature<Geometry>[]>()
    );

  // As of a change in 2026, the check layer now returns one
  // feature per affected property, with its affecting
  // layers encoded in a `paverkas_av` JSON-string property:
  //   [{"id":"<hajk-layer-id>","text":"..."}, ...]
  // To make a minimal amount of changes to the rest of the pipeline, we decode that
  // back into the old shape, which is one feature per affecting layer, and with the property ID as a separate attribute. This way, the rest of the code can continue
  // to expect the old shape, and we only do the decoding here in the beginning of the flow.
  #expandCheckLayerFeatures = (
    parentFeatures: Feature<Geometry>[]
  ): Feature<Geometry>[] => {
    const layersConfig = (this.#app.config.layersConfig ?? []) as Array<{
      id: string;
      name?: string;
      caption?: string;
      layers?: string[];
    }>;
    const expanded: Feature<Geometry>[] = [];

    for (const parent of parentFeatures) {
      const raw = parent.get(this.#checkLayerAffectedByAttribute) as
        | string
        | undefined;
      if (raw === undefined) {
        console.warn(
          `PropertyChecker: feature has no \`${this.#checkLayerAffectedByAttribute}\` attribute, skipping.`
        );
        continue;
      }

      let entries: PaverkasAvEntry[];
      try {
        entries = JSON.parse(raw) as PaverkasAvEntry[];
      } catch (e) {
        console.warn(
          `PropertyChecker: failed to parse \`${this.#checkLayerAffectedByAttribute}\` JSON, skipping feature.`,
          e
        );
        continue;
      }
      if (!Array.isArray(entries) || entries.length === 0) {
        continue;
      }

      const propertyAttrValue = parent.get(this.#checkLayerPropertyAttribute);
      const geometry = parent.getGeometry();

      for (const entry of entries) {
        const layerConfig = layersConfig.find((l) => l.id === entry.id);
        if (!layerConfig) {
          console.warn(
            `PropertyChecker: layer id "${entry.id}" from \`${this.#checkLayerAffectedByAttribute}\` not found in layersConfig, skipping.`
          );
          continue;
        }

        const synthetic = new OlFeature({
          geometry: geometry?.clone(),
        });
        synthetic.set("id", layerConfig.id);
        synthetic.set("caption", layerConfig.caption ?? "");
        synthetic.set(
          "layer",
          layerConfig.layers?.[0] ?? layerConfig.name ?? layerConfig.id
        );
        synthetic.set(this.#checkLayerPropertyAttribute, propertyAttrValue);
        synthetic.set("paverkasAvText", entry.text);
        expanded.push(synthetic);
      }
    }
    return expanded;
  };

  #handleFeatureAdded = async (feature: Feature<Geometry>) => {
    const geometry = feature.getGeometry();
    if (!geometry) return;

    const coords = (
      geometry as import("ol/geom/Point").default
    ).getCoordinates();

    // We will do two GetFeatureInfo requests here: one to the check layer and
    // one to the digital plans layer. Each result will be used in its own View
    // as we've noticed that the administrators often want to see those aspects
    // in separate views but still related to each other.

    // Check Layer features
    const rawCheckLayerFeatures = await this.#getOlFeaturesForCoordsAndOlLayer(
      coords,
      this.#checkLayer
    );
    // Decode `paverkas_av` and expand into the legacy flat-array shape.
    const checkLayerFeatures = this.#expandCheckLayerFeatures(
      rawCheckLayerFeatures
    );

    // Let's group the flat array of objects into an array where key is
    // the property ID (or whatever is configured in the Admin).
    const groupedCheckLayerFeatures = this.#groupFeaturesByAttributeName(
      checkLayerFeatures,
      this.#checkLayerPropertyAttribute, // the attribute name that we wish to group on
      true // we want to add the marker feature to the map
    );

    // Digital Plans features
    const digitalPlanFeatures = await this.#getOlFeaturesForCoordsAndOlLayer(
      coords,
      this.#digitalPlansLayer
    );
    const groupedDigitalPlanFeatures = this.#groupFeaturesByAttributeName(
      digitalPlanFeatures,
      this.#groupDigitalPlansLayerByAttribute
    );

    const groupedDigitalPlanFeaturesWithGroupedUseType: GroupedDigitalPlanFeatures =
      {};

    // Digital plans must be further grouped by use type. The attribute
    // is specified by the admin setting groupDigitalPlansLayerSecondLevelByAttribute.
    for (const key in groupedDigitalPlanFeatures) {
      if (Object.hasOwnProperty.call(groupedDigitalPlanFeatures, key)) {
        const element = groupedDigitalPlanFeatures[key];
        groupedDigitalPlanFeaturesWithGroupedUseType[key] = {
          ...element, // Spread whatever already exists…
          features: Object.fromEntries(
            // but replace "features" with the grouped results.
            this.#groupedMap(
              element.features,
              this.#groupDigitalPlansLayerSecondLevelByAttribute
            )
          ),
        };
      }
    }

    // Let's find out how many results of each type we've got.
    const amountOfProperties = Object.keys(groupedCheckLayerFeatures).length;
    const amountOfDigitalPlans = Object.keys(
      groupedDigitalPlanFeaturesWithGroupedUseType
    ).length;

    // When user clicks, check that the click was valid by controlling that…
    if (
      amountOfProperties === 1 && // …we've got exactly one property in the response…
      amountOfDigitalPlans < 2 // …and there are no or one digital plan. (I.e. don't allow results in places with more than one digital plan)
    ) {
      // Tell the rest of the plugin that we've got features. The View
      // subscribes to this and will update itself accordingly.
      this.#localObserver.publish("getFeatureInfoFeatures", {
        groupedFeatures: groupedCheckLayerFeatures,
        digitalPlanFeatures: groupedDigitalPlanFeaturesWithGroupedUseType,
      });
    } else {
      this.#localObserver.publish("noFeaturesInResult", {
        amountOfProperties,
        amountOfDigitalPlans,
      });
    }
  };

  // Example of public method, returns the map instance
  getMap = () => {
    return this.#map;
  };

  // Example of public method, returns the app instance
  getApp = () => {
    return this.#app;
  };
}
