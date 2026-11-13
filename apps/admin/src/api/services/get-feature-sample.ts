export type SampleFeatureProperties = Record<string, unknown>;

export interface SampleFeature {
  id: string;
  properties: SampleFeatureProperties;
}

interface GeoJsonFeatureCollection {
  features?: {
    id?: string | number;
    properties?: SampleFeatureProperties | null;
  }[];
}

export const SAMPLE_FEATURE_LIMIT = 5;

export async function fetchFeatureSample(
  baseUrl: string,
  typeName: string,
  count = SAMPLE_FEATURE_LIMIT,
): Promise<SampleFeature[]> {
  const url = new URL(baseUrl);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", typeName);
  url.searchParams.set("maxFeatures", String(count));
  url.searchParams.set("outputFormat", "application/json");

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`GetFeature failed with status ${response.status}`);
  }

  const data = JSON.parse(await response.text()) as GeoJsonFeatureCollection;
  if (!Array.isArray(data.features)) {
    throw new Error("GetFeature did not return GeoJSON features");
  }
  return data.features.slice(0, count).map((feature, index) => ({
    id: String(feature.id ?? index + 1),
    properties: feature.properties ?? {},
  }));
}
