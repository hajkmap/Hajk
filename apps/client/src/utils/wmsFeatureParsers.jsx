import Feature from "ol/Feature";

import GeoJSON from "ol/format/GeoJSON";
import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo";

const geoJsonParser = new GeoJSON();
const wmsGetFeatureInfoParser = new WMSGetFeatureInfo();

export function parseGeoJsonFeatures(json) {
  return geoJsonParser.readFeatures(json);
}

export function parseGMLFeatures(gml) {
  return wmsGetFeatureInfoParser.readFeatures(gml);
}

// Special implementation for parsing text/xml responses from Esri, see #1266
export function experimentalParseEsriWmsRawXml(xml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");

  // Consider making this a setting
  const namespacePrefix = "esri_wms";

  const collections = xmlDoc.getElementsByTagName(
    `${namespacePrefix}:FeatureInfoCollection`
  );

  // Let's loop the collections using a flat map (the resulting object must
  // be flat, not grouped by layer as this response).
  const features = Array.from(collections).flatMap((c) => {
    // First grab the layer name (it's an attribute to the collection DOM node)
    const layerName = c.getAttribute("layername") || "unknownLayerName";

    // Next, loop the collection's children to extract features
    const featureInfos = Array.from(c.children).map((f, i) => {
      // Create an OL Feature
      const newFeature = new Feature();

      // Ensure it has an ID
      newFeature.setId(`${layerName}.fid${i}`);

      // Extract "FIELDS", i.e. the attribute values of this feature
      const fields = f.getElementsByTagName(`${namespacePrefix}:Field`);

      // Loop the fields…
      Array.from(fields).forEach((field) => {
        // …grab the key…
        const attributeName = field.getElementsByTagName(
          `${namespacePrefix}:FieldName`
        )[0].textContent;

        // …and the value corresponding with this attribute…
        const attributeValue = field.getElementsByTagName(
          `${namespacePrefix}:FieldValue`
        )[0].textContent;

        // …and set as OL attributes on our OL Feature.
        newFeature.set(attributeName, attributeValue);
      });

      return newFeature;
    });

    return featureInfos;
  });

  return features;
}

// Special implementation for parsing text/xml responses from Esri, see #1090.
export function parseWmsGetFeatureInfoXml(xml) {
  // As this takes care of text/xml, we should try using the OL's built-in parser, see
  // https://openlayers.org/en/latest/apidoc/module-ol_format_WMSGetFeatureInfo-WMSGetFeatureInfo.html.
  const parsedAsWmsFeatureInfo = wmsGetFeatureInfoParser.readFeatures(xml);

  // If we've successfully parsed at least one feature using the official parser and
  // it looks as we have valid IDs on our feature, let's return.
  if (
    parsedAsWmsFeatureInfo.length > 0 &&
    parsedAsWmsFeatureInfo[0].getId() !== undefined
  ) {
    return parsedAsWmsFeatureInfo;
  }

  // Otherwise something is wrong and we must try to parse the data manually.
  // There are currently two known options:
  // A: a raster source (e.g. from a GeoTIFF) that simply lacks IDs on the features
  //    and only returns e.g. color value for the clicked pixel.
  // B: A Esri ArcGIS XML response that lacks geometries and correct layer mappings
  //    for features returned. In this case it's preferred to use another value for
  //    INFO_FORMAT, see #1266, but we can also try parse this is text/xml was used.

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");

  // OPTION A: FeatureCollection that lacks value for feature IDs (see #1274)
  const featureCollection =
    xmlDoc.getElementsByTagName("wfs:FeatureCollection") || // This should work…
    xmlDoc.getElementsByTagName("FeatureCollection"); // …but let's try this too, just in case.
  if (featureCollection[0]) {
    return wmsRasterParser(featureCollection);
  }

  // OPTION B: Esri's text/xml (see #1266)
  const featureInfoResponse = xmlDoc.getElementsByTagName(
    "FeatureInfoResponse"
  );

  if (featureInfoResponse[0]) {
    return esriTextXmlParser(featureInfoResponse);
  }

  // If everything failed, bail out…
  console.warn(
    "Failed to parse infoclick features from the following response:"
  );
  console.warn(xml);
  return [];
}

/**
 * We're trying to parse something like this:
 * 
        <wfs:FeatureCollection xmlns="http://www.opengis.net/wfs" ...>
            <gml:boundedBy>
                <gml:null>unknown</gml:null>
            </gml:boundedBy>
            <gml:featureMember>
                <bmf:ndem_2022 fid="">
                    <bmf:GRAY_INDEX>7.832002639770508</bmf:GRAY_INDEX>
                </bmf:ndem_2022>
            </gml:featureMember>
            <gml:featureMember>
                <bmf:dtm_2022 fid="">
                    <bmf:GRAY_INDEX>24.24799919128418</bmf:GRAY_INDEX>
                </bmf:dtm_2022>
            </gml:featureMember>
        </wfs:FeatureCollection>
    * 
    * So we loop all children of FeatureCollection and filter out
    * those that are 'featureMember's. 
    * 
    * Each 'featureMember' will have one child each, and that's where
    * we get the intresseting information about layer name and attributes.
    * 
    */
function wmsRasterParser(featureCollection) {
  const features = Array.from(featureCollection[0].children)
    .filter(
      (potentialFeature) => potentialFeature.localName === "featureMember"
    )
    .map((potentialFeature, i) => {
      // 'potentialFeature' will be something like <gml:featureMember>.
      // It does not contain anything useful itself, but it has one child
      // (see example above) and that's where we get our info from.

      const feature = new Feature();

      // Layer name is "hidden" as element's name. We use 'localName'
      // rather than 'nodeName' to get rid of the schema part (i.e just
      // "bar" from <foo:bar>).
      const layerName = potentialFeature.firstElementChild.localName;
      feature.setId(`${layerName}.fid${i}`);

      // Extract attributes from XML and set on OL Feature
      Array.from(potentialFeature.firstElementChild.children).forEach(
        (attribute) => {
          // As this comes as XML rather than JSON, every value is a
          // text node. Let's try restoring numeric values.
          let attrValue;
          try {
            attrValue =
              attribute.textContent.lengthNumber > 0 && // Don't allow empty strings (as they'd be parsed as 0)
              !Number.isNaN(Number(attribute.textContent)) // Don't allow parsing resulting in NaN
                ? Number(attribute.textContent) // Use parsed value if conditions above were met, else…
                : attribute.textContent; // …just user the text value
          } catch (error) {
            attrValue = attribute.textContent; // If parsing resulted in an error, just use the text value.
          }
          feature.set(attribute.localName, attrValue);
        }
      );
      return feature;
    });
  return features;
}

function esriTextXmlParser(featureInfoResponse) {
  const fields = Array.from(
    featureInfoResponse[0].getElementsByTagName("FIELDS")
  );

  const features = fields.map((f, i) => {
    const feature = new Feature();
    // Ensure we have a feature id
    feature.setId(`unknownArcGISLayerIssue1266.fid${i}`);
    for (let i = 0; i < f.attributes.length; i++) {
      const attribute = f.attributes[i];
      feature.set(attribute.name, attribute.value);
    }
    return feature;
  });
  return features;
}
