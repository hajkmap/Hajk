import type { EventObserver } from "react-event-observer";
import type OlMap from "ol/Map";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

/**
 * Represents the main Hajk application instance that is passed around
 * to plugins and models via the `app` prop.
 */
export interface HajkApp {
  /** The OpenLayers Map instance */
  map: OlMap;
  /** Global event observer for cross-plugin communication */
  globalObserver: EventObserver;
  /** Application configuration */
  config: {
    userDetails?: UserDetails;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Describes user details available from the application config,
 * typically populated via ActiveDirectory or similar auth.
 */
export interface UserDetails {
  displayName: string;
  description: string;
}

/**
 * Options for adding a feature via DrawModel.
 */
export interface AddFeatureOptions {
  silent?: boolean;
}

/**
 * Describes the DrawModel's public API surface. Since the DrawModel is
 * written in plain JS and has no .d.ts file of its own, we declare the
 * methods used by our TypeScript code here.
 */
export interface DrawModelInterface {
  toggleDrawInteraction(drawMethod?: string, settings?: object): void;
  addFeature(feature: Feature<Geometry>, settings?: AddFeatureOptions): void;
  removeDrawnFeatures(): void;
  removeFeature(feature: Feature<Geometry>): void;
  getAllDrawnFeatures(): Feature<Geometry>[];
  getCurrentExtent(): import("ol/extent").Extent;
  getCurrentLayerName(): string;
  refreshDrawLayer(): void;
  refreshFeaturesTextStyle(): void;
  zoomToCurrentExtent(): void;
  getCurrentVectorSource(): import("ol/source/Vector").default;
}
