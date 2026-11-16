export const FME_API_V3 = "v3";
export const FME_API_V4 = "v4";

const FME_API_VERSIONS = [FME_API_V4, FME_API_V3];

function getApiBaseSegment(version) {
  return version === FME_API_V4 ? "fmeapiv4" : "fmerest/v3";
}

export function buildFmeProxyUrl(proxyBase, path, version) {
  const fmeProxyBase = proxyBase.endsWith("/fmeproxy")
    ? proxyBase
    : `${proxyBase.replace(/\/$/, "")}/fmeproxy`;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${fmeProxyBase}/${getApiBaseSegment(version)}${normalizedPath}`;
}

export function getRepositoriesUrl(proxyBase, version) {
  const path =
    version === FME_API_V4
      ? "/repositories"
      : "/repositories?limit=-1&offset=-1";
  return buildFmeProxyUrl(proxyBase, path, version);
}

export function getWorkspacesUrl(proxyBase, repository, version) {
  return buildFmeProxyUrl(
    proxyBase,
    `/repositories/${encodeURIComponent(repository)}/items`,
    version
  );
}

export function getParametersUrl(proxyBase, repository, workspace, version) {
  const path =
    version === FME_API_V4
      ? `/workspaces/${encodeURIComponent(repository)}/${encodeURIComponent(workspace)}/parameters`
      : `/repositories/${encodeURIComponent(repository)}/items/${encodeURIComponent(workspace)}/parameters`;
  return buildFmeProxyUrl(proxyBase, path, version);
}

async function probeApiVersion(proxyBase, version, fetchFn) {
  try {
    const response = await fetchFn(getRepositoriesUrl(proxyBase, version));
    if (!response.ok) {
      return false;
    }
    await response.json();
    return true;
  } catch {
    return false;
  }
}

export async function resolveApiVersion(proxyBase, fetchFn) {
  for (const version of FME_API_VERSIONS) {
    if (await probeApiVersion(proxyBase, version, fetchFn)) {
      return version;
    }
  }

  return FME_API_V3;
}

const FME_PARAMETER_TYPE_ALIASES = {
  DROPDOWN: "CHOICE",
  LOOKUP_DROPDOWN: "LOOKUP_CHOICE",
  MULTICHOICE: "LISTBOX",
  MULTI_CHOICE: "LISTBOX",
  MULTISELECT: "LISTBOX",
  MULTI_SELECT: "LISTBOX",
  LOOKUP_MULTICHOICE: "LOOKUP_LISTBOX",
  LOOKUP_MULTISELECT: "LOOKUP_LISTBOX",
  LOOKUP_MULTI_SELECT: "LOOKUP_LISTBOX",
  SLIDER: "RANGE_SLIDER",
  RANGE: "RANGE_SLIDER",
  TEXT_EDIT: "TEXT",
  TEXTEDIT: "TEXT",
  STRING_OR_CHOICE: "CHOICE",
  CHOICE_OR_TEXT: "CHOICE",
  INT_OR_CHOICE: "CHOICE",
  FLOAT_OR_CHOICE: "CHOICE",
  YESNO: "YES_NO",
  CHECK_BOX: "CHECKBOX",
  MULTILINE: "TEXTAREA",
  MULTILINE_TEXT: "TEXTAREA",
  MULTI_LINE_TEXT: "TEXTAREA",
  SOURCE_FILE: "SOURCE_DATASET",
  DEST_FILE: "DESTINATION_DATASET",
  SOURCE_DIR: "DIRECTORY",
  DEST_DIR: "DIRECTORY",
  FILE_OR_URL: "FILE_FOLDER_URL",
  FILE_URL: "FILE_FOLDER_URL",
  FILE_FOLDER: "FILE_FOLDER_URL",
  FOLDER: "DIRECTORY",
  FOLDER_PATH: "DIRECTORY",
  DEST_FOLDER: "DIRECTORY",
  SOURCE_FOLDER: "DIRECTORY",
  GRID_SHIFT_FILE: "REPROJECTION_FILE",
  COORDSYS: "COORD_SYS",
  MAP_COORDSYS: "COORD_SYS",
  IP_ADDRESS: "IPADDRESS",
  MAC_ADDRESS: "MACADDRESS",
  URL: "LINK",
  REAL: "FLOAT",
  DECIMAL: "FLOAT",
  NUMBER: "FLOAT",
  DATE_TIME: "DATETIME",
  STATIC_TEXT: "INFO",
  HEADING: "LABEL",
};

function toScreamingSnakeType(type) {
  return String(type)
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

export function getPublishedParameterType(parameter) {
  const raw =
    parameter?.type ?? parameter?.parameterType ?? parameter?.parameter_type;
  if (raw == null || raw === "") {
    return "";
  }
  const normalized = toScreamingSnakeType(raw);
  return FME_PARAMETER_TYPE_ALIASES[normalized] ?? normalized;
}

function normalizeListOptions(parameter) {
  const options =
    parameter.listOptions ??
    parameter.options ??
    parameter.choiceSettings?.choices ??
    parameter.choices ??
    [];

  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option) => {
    if (typeof option === "string") {
      return { caption: option, value: option };
    }
    return {
      caption:
        option.caption ??
        option.display ??
        option.label ??
        String(option.value ?? ""),
      value: option.value ?? option.caption ?? option.display ?? "",
    };
  });
}

export function isPublishedParameterOptional(parameter) {
  if (typeof parameter?.optional === "boolean") {
    return parameter.optional;
  }
  if (typeof parameter?.required === "boolean") {
    return !parameter.required;
  }
  return false;
}

export function normalizePublishedParameter(parameter) {
  if (!parameter || typeof parameter !== "object") {
    return parameter;
  }
  const optional = isPublishedParameterOptional(parameter);
  const type = getPublishedParameterType(parameter);
  return {
    ...parameter,
    type,
    description:
      parameter.description ?? parameter.prompt ?? parameter.label ?? "",
    listOptions: normalizeListOptions(parameter),
    optional,
    required: !optional,
  };
}

function collectParametersFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.items && Array.isArray(data.items)) {
    return data.items;
  }
  if (data?.parameters && Array.isArray(data.parameters)) {
    return data.parameters;
  }
  if (data?.publishedParameters && Array.isArray(data.publishedParameters)) {
    return data.publishedParameters;
  }
  if (data?.data?.parameters && Array.isArray(data.data.parameters)) {
    return data.data.parameters;
  }
  return [];
}

export function normalizeParametersResponse(data) {
  return collectParametersFromResponse(data).map(normalizePublishedParameter);
}

export function normalizeListResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.items && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}

export function extractListItemNames(items) {
  return items
    .map((item) => (typeof item === "string" ? item : item?.name))
    .filter(Boolean);
}
