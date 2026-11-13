import type { PublishedParameter, SliderValueResolver } from "../types";
import { getParameterUiKind } from "./parameterUi";

/**
 * Returns the scalar value of a parameter.
 * This is the value of the parameter as a string, number, or boolean.
 */
function scalarValue(parameter: PublishedParameter): string | number | boolean {
  return (parameter.value ?? parameter.defaultValue ?? "") as
    string | number | boolean;
}

/**
 * Returns the value of a parameter to be submitted to the FME server.
 * This is the value of the parameter as a string, number, boolean, or array of strings.
 */
export function getParameterSubmitValue(
  parameter: PublishedParameter,
  resolveSliderValue?: SliderValueResolver
): string | number | boolean | string[] {
  switch (getParameterUiKind(parameter)) {
    case "MULTISELECT":
      return (parameter.value ?? parameter.defaultValue ?? []) as string[];
    case "BOOLEAN":
      return Boolean(parameter.value ?? parameter.defaultValue ?? false);
    case "SLIDER":
      return resolveSliderValue
        ? resolveSliderValue(parameter).value
        : scalarValue(parameter);
    default:
      return scalarValue(parameter);
  }
}

/**
 * Formats a parameter as name=value for data-download (application/x-www-form-urlencoded).
 */
export function formatParameterForFormBody(
  parameter: PublishedParameter,
  resolveSliderValue?: SliderValueResolver
): { name: string; value: string } {
  const value = getParameterSubmitValue(parameter, resolveSliderValue);
  return {
    name: parameter.name,
    value: Array.isArray(value) ? value.join(",") : String(value),
  };
}
