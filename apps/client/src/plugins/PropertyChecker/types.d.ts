import type { EventObserver } from "react-event-observer";
import type OlMap from "ol/Map";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";
import type { HajkApp, DrawModelInterface } from "../../types/hajk";

// ---- Plugin options (from Admin config) ----

export interface PropertyCheckerOptions {
  visibleAtStart?: boolean;
  title?: string;
  description?: string;
  /** Attribute name used to group check-layer features (e.g. property ID) */
  checkLayerPropertyAttribute: string;
  /** Layer ID for the check layer in the OL Map */
  checkLayerId: string;
  /** Layer ID for the digital plans layer in the OL Map */
  digitalPlansLayerId: string;
  /** Attribute name for first-level grouping of digital plan features */
  groupDigitalPlansLayerByAttribute: string;
  /** Attribute name for second-level grouping of digital plan features */
  groupDigitalPlansLayerSecondLevelByAttribute: string;
  /** Comma-separated layer IDs for the buildings quick-toggle */
  buildingsLayerIds: string;
  /** Comma-separated layer IDs for the borders quick-toggle */
  bordersLayerIds: string;
  /** Comma-separated layer IDs for the plans quick-toggle */
  plansLayerIds: string;
  [key: string]: unknown;
}

// ---- PropertyChecker plugin (top-level) props ----

export interface PropertyCheckerProps {
  app: HajkApp;
  map: OlMap;
  options: PropertyCheckerOptions;
  [key: string]: unknown;
}

// ---- Model constructor settings ----

export interface PropertyCheckerModelSettings extends PropertyCheckerOptions {
  app: HajkApp;
  drawModel: DrawModelInterface;
  localObserver: EventObserver;
  map: OlMap;
}

// ---- View props ----

export interface PropertyCheckerViewProps {
  app: HajkApp;
  drawInteraction: string;
  drawModel: DrawModelInterface;
  globalObserver: EventObserver;
  localObserver: EventObserver;
  map: OlMap;
  model: import("./PropertyCheckerModel").default;
  options: PropertyCheckerOptions;
  setDrawInteraction: React.Dispatch<React.SetStateAction<string>>;
}

// ---- Feature grouping result ----

/** A single grouped property entry, holding a marker and its matching features */
export interface GroupedPropertyEntry {
  markerFeature: Feature<Geometry>;
  features: Feature<Geometry>[];
}

/** Keyed by the property identifier value */
export interface GroupedFeatures {
  [identifier: string]: GroupedPropertyEntry;
}

/** Second-level grouped digital plan features (features keyed by use-type) */
export interface GroupedDigitalPlanEntry {
  markerFeature: Feature<Geometry>;
  features: Record<string, Feature<Geometry>[]>;
}

export interface GroupedDigitalPlanFeatures {
  [identifier: string]: GroupedDigitalPlanEntry;
}

// ---- Observer event payloads ----

export interface GetFeatureInfoPayload {
  groupedFeatures: GroupedFeatures;
  digitalPlanFeatures: GroupedDigitalPlanFeatures;
}

export interface NoFeaturesPayload {
  amountOfProperties: number;
  amountOfDigitalPlans: number;
}
