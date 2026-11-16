import type { ListOption, PublishedParameter } from "../types";
import {
  normalizeRawType,
  resolvePublishedParameterUiKind,
} from "./parameterUi";

/**
 * Returns the raw parameter type from the parameter record.
 * This is the type of the parameter as it is returned by the FME server.
 */
function getRawParameterType(parameter: Record<string, unknown>): unknown {
  return (
    parameter?.type ?? parameter?.parameterType ?? parameter?.parameter_type
  );
}

/**
 * Normalizes the list options from the parameter record.
 * We need to normalize the list options because the FME server returns the options in different formats for v3 and v4.
 */
function normalizeListOptions(
  parameter: Record<string, unknown>
): ListOption[] {
  const options =
    parameter.listOptions ??
    parameter.options ??
    (parameter.choiceSettings as { choices?: unknown[] } | undefined)
      ?.choices ??
    parameter.choices ??
    [];

  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option): ListOption => {
    if (typeof option === "string") {
      return { caption: option, value: option };
    }
    const opt = option as Record<string, unknown>;
    return {
      caption: String(
        opt.caption ?? opt.display ?? opt.label ?? opt.value ?? ""
      ),
      value: String(opt.value ?? opt.caption ?? opt.display ?? ""),
    };
  });
}

/**
 * Checks if a parameter is optional.
 * This is used to determine if the parameter is optional or required.
 * V3 and v4 use different fields to indicate if a parameter is optional/required...
 */
export function isPublishedParameterOptional(
  parameter: PublishedParameter
): boolean {
  if (typeof parameter.optional === "boolean") {
    return parameter.optional;
  }
  if (typeof parameter.required === "boolean") {
    return !parameter.required;
  }
  return false;
}

/**
 * Normalizes a parameter record into a PublishedParameter object.
 * This is used to convert the parameter record into a PublishedParameter object.
 */
function normalizePublishedParameter(
  parameter: Record<string, unknown>
): PublishedParameter {
  const optional = isPublishedParameterOptional(
    parameter as unknown as PublishedParameter
  );
  const rawType = getRawParameterType(parameter);
  const hasType = rawType != null && rawType !== "";
  const type = hasType ? normalizeRawType(rawType) : "";
  const valueType =
    parameter.valueType == null ? undefined : String(parameter.valueType);
  const normalized: PublishedParameter = {
    ...parameter,
    type,
    valueType,
    description: String(
      parameter.description ?? parameter.prompt ?? parameter.label ?? ""
    ),
    listOptions: normalizeListOptions(parameter),
    optional,
    required: !optional,
    name: String(parameter.name ?? ""),
  };
  normalized.uiKind = resolvePublishedParameterUiKind(normalized);
  return normalized;
}

/**
 * Collects the parameters from the response.
 * The response from the FME server can be an array of parameters, or an object with a parameters property that is an array of parameters.
 * We need to collect the parameters from the response so that we can normalize them into PublishedParameter objects.
 */
function collectParametersFromResponse(
  data: Record<string, unknown> | unknown[]
): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) {
    return obj.items as Record<string, unknown>[];
  }
  if (Array.isArray(obj.parameters)) {
    return obj.parameters as Record<string, unknown>[];
  }
  if (Array.isArray(obj.publishedParameters)) {
    return obj.publishedParameters as Record<string, unknown>[];
  }
  const nested = obj.data as Record<string, unknown> | undefined;
  if (nested && Array.isArray(nested.parameters)) {
    return nested.parameters as Record<string, unknown>[];
  }
  return [];
}

/**
 * Normalizes the parameters response.
 * This is used to normalize the parameters response into a array of PublishedParameter objects.
 */
export function normalizeParametersResponse(
  data: Record<string, unknown> | unknown[]
): PublishedParameter[] {
  return collectParametersFromResponse(data).map(normalizePublishedParameter);
}
