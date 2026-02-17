import type { EventObserver } from "react-event-observer";
import type OlMap from "ol/Map";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";
import type Layer from "ol/layer/Layer";
import type Source from "ol/source/Source";
import type {
  HajkApp,
  DrawModelInterface,
  UserDetails,
} from "../../types/hajk";

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
  /** Enable the report feature for the check-layer tab */
  enableCheckLayerReport?: boolean;
  /** Enable the report feature for the digital-plans tab */
  enableDigitalPlansReport?: boolean;
  /** Attribute name used as the title for digital plan items */
  digitalPlanItemTitleAttribute: string;
  /** Attribute descriptors rendered in the digital plan item subheader */
  digitalPlanItemDescriptionAttributes: DigitalPlanDescriptionAttribute[];
  /** Attribute holding the digital plan status text */
  digitalPlanStatusAttribute: string;
  /** Attribute holding the digital plan status date */
  digitalPlanStatusDateAttribute: string;
  /** Attribute holding the digital plan description / purpose text */
  digitalPlanDescriptionAttribute: string;
  /** Ordered list of second-level use-types for digital plan reports */
  digitalPlansLayerSecondLevelOrder: string[];
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

// ---- Shared helper types ----

/** Describes a single column descriptor used to build digital plan item descriptions */
export interface DigitalPlanDescriptionAttribute {
  column: string;
  label: string;
  fallbackValue?: string;
}

/** A layer entry selected by the user for inclusion in a report */
export interface ControlledLayer {
  id: string;
  layer: string;
  caption: string;
  subcaption: string | null;
  propertyName: string;
}

/** A regulation entry selected by the user for inclusion in a digital plan report */
export interface ControlledRegulation {
  id: string;
  regulationName: string;
  regulationCaptionAsElement: React.ReactNode[];
  regulationCaptionAsArray: string[];
  digitalPlanKey: string;
  useType: string;
}

/** User notes keyed by a unique layer/regulation ID */
export type LayerNotes = Record<string, string>;

// ---- View component props ----

export interface InfoDialogProps {
  localObserver: EventObserver;
}

export interface QuickLayerToggleButtonsProps {
  map: OlMap;
  options: PropertyCheckerOptions;
}

export interface PropertyItemProps {
  clickedPointsCoordinates: number[];
  controlledLayers: ControlledLayer[];
  digitalPlanFeatures: GroupedDigitalPlanFeatures;
  features: GroupedPropertyEntry;
  globalObserver: EventObserver;
  olMap: OlMap;
  options: PropertyCheckerOptions;
  setControlledLayers: React.Dispatch<React.SetStateAction<ControlledLayer[]>>;
  startExpanded: boolean;
  userDetails?: UserDetails;
}

export interface LayerCheckerTabContentViewProps {
  clickedPointsCoordinates: number[];
  controlledLayers: ControlledLayer[];
  features: GroupedPropertyEntry;
  globalObserver: EventObserver;
  layerNotes: LayerNotes;
  olMap: OlMap;
  options: PropertyCheckerOptions;
  setControlledLayers: React.Dispatch<React.SetStateAction<ControlledLayer[]>>;
  setLayerNotes: React.Dispatch<React.SetStateAction<LayerNotes>>;
  userDetails?: UserDetails;
}

export interface FeatureItemProps {
  clickedPointsCoordinates: number[];
  controlledLayers: ControlledLayer[];
  feature: Feature<Geometry>;
  globalObserver: EventObserver;
  layerNotes: LayerNotes;
  olLayer: Layer<Source>;
  olMap: OlMap;
  options: PropertyCheckerOptions;
  propertyName: string;
  setControlledLayers: React.Dispatch<React.SetStateAction<ControlledLayer[]>>;
  setLayerNotes: React.Dispatch<React.SetStateAction<LayerNotes>>;
}

export interface LayerCheckerReportDialogProps {
  reportDialogVisible: boolean;
  setReportDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
  currentPropertyName: string;
  controlledLayers: ControlledLayer[];
  layerNotes: LayerNotes;
  userDetails?: UserDetails;
}

export interface DigitalPlanCheckerTabContentViewProps {
  digitalPlanFeatures: GroupedDigitalPlanFeatures;
  options: PropertyCheckerOptions;
  userDetails?: UserDetails;
}

export interface DigitalPlanProps {
  digitalPlanKey: string;
  plan: GroupedDigitalPlanEntry;
  options: PropertyCheckerOptions;
  userDetails?: UserDetails;
}

export interface DigitalPlanItemProps {
  feature: Feature<Geometry>;
  digitalPlanKey: string;
  controlledRegulations: ControlledRegulation[];
  setControlledRegulations: React.Dispatch<
    React.SetStateAction<ControlledRegulation[]>
  >;
  regulationNotes: LayerNotes;
  setRegulationNotes: React.Dispatch<React.SetStateAction<LayerNotes>>;
  options: PropertyCheckerOptions;
  useType: string;
}

export interface DigitalPlanReportDialogProps {
  reportDialogVisible: boolean;
  setReportDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
  digitalPlanKey: string;
  markerFeature: Feature<Geometry>;
  controlledRegulations: ControlledRegulation[];
  layerNotes: LayerNotes;
  userDetails?: UserDetails;
  options: PropertyCheckerOptions;
}
