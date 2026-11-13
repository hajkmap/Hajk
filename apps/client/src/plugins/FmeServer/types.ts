import type { EventObserver } from "react-event-observer";
import type { HajkApp } from "../../types/hajk";
import type OlMap from "ol/Map";
import type FmeServerModel from "./models/FmeServerModel";
import type MapViewModel from "./models/MapViewModel";
import type { ParameterUiKind } from "./api/parameterUi";

// ---- FME REST API ----
export type FmeApiVersion = "v3" | "v4";
export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

// ---- Plugin configuration ----
export interface FmeProduct {
  name: string;
  group: string;
  repository: string;
  workspace: string;
  geoAttribute?: string;
  maxArea?: number;
  infoUrl?: string;
  promptForEmail?: boolean;
  allowMultipleGeometries?: boolean;
  availableForGroups?: string;
}

export interface FmeServerOptions {
  productGroups?: string[];
  products?: FmeProduct[];
  groupDisplayName?: string;
  drawStrokeColor?: string;
  drawFillColor?: string;
  [key: string]: unknown;
}

export interface FmeServerPluginProps {
  app: HajkApp;
  map: OlMap;
  options: FmeServerOptions;
  [key: string]: unknown;
}

// ---- Published parameters ----
export interface ListOption {
  caption: string;
  value: string;
}

export interface PublishedParameter {
  name: string;
  type: string;
  /** v4 valueType hint (string/number/bool) used to refine generic controls. */
  valueType?: string;
  /** Resolved Hajk UI control, computed once during normalization. */
  uiKind?: ParameterUiKind;
  description: string;
  value?: string | number | boolean | string[];
  defaultValue?: string | number | boolean | string[];
  listOptions: ListOption[];
  optional: boolean;
  required: boolean;
  minimum?: number;
  maximum?: number;
  minimumExclusive?: boolean;
  maximumExclusive?: boolean;
  decimalPrecision?: number;
  [key: string]: unknown;
}

export interface ParameterToSend {
  name: string;
  value: string | number | boolean | string[];
}

/** Resolves a range-slider parameter's current value and step. */
export type SliderValueResolver = (parameter: PublishedParameter) => {
  value: number;
  step: number;
};

// ---- Job / order status ----
export type FmeJobStatus =
  "SUCCESS" | "FME_FAILURE" | "JOB_FAILURE" | "ABORTED" | "RUNNING" | string;

export type OrderStatus =
  | "NONE"
  | "ORDER_REQUEST_SENT"
  | "ORDER_REQUEST_FAILED"
  | "POLLING"
  | FmeJobStatus;

// ---- Model settings ----

export interface FmeServerModelSettings {
  app: HajkApp;
  mapViewModel: MapViewModelInterface;
  options: FmeServerOptions;
}

export interface MapViewModelSettings {
  map: OlMap;
  localObserver: EventObserver;
  options: FmeServerOptions;
}

// ---- Observer event payloads ----

export interface FeatureAddedPayload {
  error: boolean;
  features: import("ol/Feature").default[];
  totalArea: number;
}

// ---- Model public interfaces (for hooks/components) ----
// Derived from the classes so the public surface can never drift from the impl.

export type MapViewModelInterface = MapViewModel;

export type FmeServerModelInterface = FmeServerModel;

// ---- API hook return type ----

export interface FmeFileUploadResult {
  error: boolean;
  path: string | null;
}

export interface FmeServerApi {
  apiVersion: FmeApiVersion | null;
  isReady: boolean;
  isResolving: boolean;
  error: boolean;
  fetchProductParameters: (
    groupName: string,
    productName: string
  ) => Promise<{ error: boolean; parameters: PublishedParameter[] }>;
  uploadParameterFile: (
    product: FmeProduct,
    file: File
  ) => Promise<FmeFileUploadResult>;
  placeOrder: (
    groupName: string,
    productName: string,
    productParameters: PublishedParameter[],
    userEmail: string
  ) => Promise<{ error: boolean; jobId: string | null }>;
  fetchJobStatus: (
    jobId: string
  ) => Promise<{ error: boolean; status: FmeJobStatus | null }>;
}

// ---- Component props ----

export interface FmeServerViewProps {
  model: FmeServerModelInterface;
  mapViewModel: MapViewModelInterface;
  mapserviceBase: string;
  options: FmeServerOptions;
  localObserver: EventObserver;
}

export interface DrawToolboxProps {
  activeDrawButton: string;
  handleDrawButtonClick: (buttonType: string) => void;
}

export interface OrderPanelProps {
  shouldPromptForEmail: boolean;
  userEmail: string;
  setUserEmail: (email: string) => void;
  orderStatus: OrderStatus;
  orderIsLoading: boolean;
  orderIsCompleted: boolean;
}

export interface ProductParametersProps {
  parameters: PublishedParameter[];
  setProductParameters: React.Dispatch<
    React.SetStateAction<PublishedParameter[]>
  >;
  infoUrl: string;
  model: FmeServerModelInterface;
  uploadParameterFile: (file: File) => Promise<FmeFileUploadResult>;
}

export interface ParameterFieldProps {
  parameter: PublishedParameter;
  index: number;
  onChange: (
    value: string | number | boolean | string[],
    index: number
  ) => void;
  model: FmeServerModelInterface;
  uploadParameterFile: (file: File) => Promise<FmeFileUploadResult>;
}

export interface InformationWrapperProps {
  children: React.ReactNode;
  type?: "error" | "warning" | "info";
}

export type StepperButtonType = "back" | "next" | "order" | "reset";

export interface StepperButton {
  type: StepperButtonType;
  disabled: boolean;
}
