import type { DescribeFeatureProperty } from "../../../api/services/describe-feature-type";
import type { FeatureProperties } from "./template-engine";
import { attributeOfPlaceholder } from "./template-validation";

export const isGeometryAttribute = (attribute: DescribeFeatureProperty) =>
  /PropertyType$|^Geometry$/i.test(attribute.localType);

const exampleValue = (attribute: DescribeFeatureProperty): string => {
  const type = attribute.localType.toLowerCase();
  if (/int|long|short/.test(type)) return "42";
  if (/double|decimal|float|number/.test(type)) return "1234.56";
  if (type.includes("datetime")) return "2026-01-15T13:30:00Z";
  if (type.includes("date")) return "2026-01-15";
  if (type.includes("bool")) return "true";
  return `Exempel ${attribute.name}`;
};

/**
 * Made-up properties for the preview when no real feature is available: one
 * value per layer attribute, or per placeholder when the attributes are unknown.
 */
export function buildExampleProperties(
  attributes: DescribeFeatureProperty[] | undefined,
  template: string,
): FeatureProperties {
  if (attributes && attributes.length > 0) {
    return Object.fromEntries(
      attributes
        .filter((attribute) => !isGeometryAttribute(attribute))
        .map((attribute) => [attribute.name, exampleValue(attribute)]),
    );
  }
  const names = new Set<string>();
  for (const match of template.matchAll(/{([^{}]*)}/g)) {
    const name = attributeOfPlaceholder(match[1]);
    if (name && !name.includes(":") && !/^\d+$/.test(name)) names.add(name);
  }
  return Object.fromEntries(
    [...names].map((name) => [name, `Exempel ${name}`]),
  );
}

/**
 * Every non-geometry attribute, in the layer's attribute order. A real feature
 * often omits attributes that have no value, while the map's infoclick still
 * shows them, so a missing or null value becomes an empty string.
 */
export function withSchemaAttributes(
  properties: FeatureProperties,
  attributes: DescribeFeatureProperty[] | undefined,
): FeatureProperties {
  if (!attributes || attributes.length === 0) return properties;
  const result: FeatureProperties = {};
  const seen = new Set<string>();
  for (const attribute of attributes) {
    if (isGeometryAttribute(attribute)) continue;
    seen.add(attribute.name);
    const value = properties[attribute.name];
    result[attribute.name] = value ?? "";
  }
  for (const [key, value] of Object.entries(properties)) {
    if (!seen.has(key)) result[key] = value;
  }
  return result;
}
