/**
 * @summary Get name of sublayer that the supplied feature is coming from feature's id
 * @description We must know which of the queried sublayers a given feature comes
 * from and the best way to determine that is by looking at the feature ID (FID).
 * It looks like WMS services set the FID using this formula:
 * [<workspaceName>:]<layerName>.[<numericFeatureId>].<numericFeatureId>
 * where the part inside "[" and "]" is optional (not used by GeoServer nor QGIS,
 * but other WMSes might use it).
 * The solution below is not pretty, and one might think that we're doing some unnecessary work, but remember
 * that the actual layerName might contain "." as well, making the matching problem kind of tedious.
 * Expects:
 *  - (OL feature) parsed from getFeatureInfo-response.
 *  - (OL layer) that has been clicked.
 * Returns:
 *  - (string) The name of the sub-layer from which the supplied feature comes from
 */
function getSubLayerNameFromFeatureId(feature, layer) {
  let subLayerName = Object.keys(layer.layersInfo).find((id) => {
    // First, the layerName from config needs some cleaning, since different service providers want different layerNames.
    const layerName = id.split(":").length === 2 ? id.split(":")[1] : id;
    // Once that is done, we have to check if the featureId contains this layerName.
    // To make things more interesting, OL's featureIds can be constructed in some different ways depending on the response from
    // the service provider. Below are some examples of how the OL featureId might look:
    // layerName.<some-feature-id>
    // layerName.<some-feature-id>.<some-feature-id>
    // As the examples above suggests, we cannot be sure that we get the actual layerName by only removing the last part of the featureId.
    // Instead, we split the featureId on dots (since the layerName and featureId-number(s) will always be separated by dots), and try to
    // create the layerName by combining the parts one by one.
    // First we'll split the featureId into it's parts...
    const fidArray = feature?.getId()?.split?.(".") || [];
    // ...then we'll loop over the parts...
    for (let i = fidArray.length - 1; i >= 0; i--) {
      // ...and create a layerName that can be matched against the layerName from config!
      if (fidArray.slice(0, i).join(".") === layerName) {
        // If the constructed string matches the layerName from config, we've found our layer!
        return true;
      }
    }
    // The layerName from the feature could not be matched against the layerId from config...
    return false;
  });

  // Temporary added ugly fix because it was urgent to get it working.
  if (
    subLayerName === undefined &&
    (feature?.getId().indexOf("undefined") === 0 || feature.getId() === "") &&
    layer.subLayers.length === 1
  ) {
    // Let's assume that the layer's name is the name of the first layer
    subLayerName = layer.subLayers[0];
    // Make sure to set a feature ID - without it we won't be able to
    // set/unset selected feature later on (an absolut requirement to
    // properly render components that follow such as Pagination, Markdown).
    feature.setId("fakeFeatureIdIssue1090");
  }

  return subLayerName;
}

/**
 * @summary Get information needed to properly render the (old) FeatureInfo-window
 * @description Will try to find the displayName and infoClickDefinition from the
 * "layerInfo"-property on the supplied layer. This function should be used as a fallback
 * when the "layersInfo"-property is missing.
 * Expects:
 *  - OL feature parsed from getFeatureInfo-response.
 *  - OL layer that has been clicked.
 * Returns:
 *  - An object containing information needed to properly render the (old) FeatureInfo-window. All information is parsed from the layer config.
 */
function getSimpleInfoClickInfoFromLayerConfig(layer) {
  // First we'll make sure a layer with the layerInfo-prop was supplied...
  const layerInfo = layer?.get("layerInfo");
  // If the prop is missing, there's nothing we can do...
  if (!layerInfo) {
    console.error(
      "getSimpleInfoClickInfoFromLayerConfig was invoked with bad parameters. The supplied layer is probably missing the layerInfo-property."
    );
    return {};
  }
  // The display name and infoClickDefinition is called caption and information on the layerInfo-prop...
  const { caption, information } = layerInfo;
  return {
    displayName: caption,
    infoclickDefinition: information,
  };
}

/**
 * @summary Get information needed to properly render the FeatureInfo-window
 * @description Will get the sub-layer from which the supplied feature comes from and
 * extract all necessary information needed to properly render the FeatureInfo-window.
 * Expects:
 *  - OL feature parsed from getFeatureInfo-response.
 *  - OL layer that has been clicked.
 * Returns:
 *  - An object containing information needed to properly render the FeatureInfo-window. All information is parsed from the layer config.
 */
export function getInfoClickInfoFromLayerConfig(feature, layer) {
  if (!feature || !layer) {
    console.error(
      "getInfoClickInfoFromLayerConfig was called with bad parameters."
    );
    return {};
  }
  // If layersInfo is missing, we wont be able to find the info-click-info in "layer.layersInfo"...
  // Luckily, some layers store (more simple) info-click-info on another layer-property, so let's try to find that instead.
  if (!layer.layersInfo) {
    return getSimpleInfoClickInfoFromLayerConfig(layer);
  }
  const subLayerName = getSubLayerNameFromFeatureId(feature, layer);
  // Having just the layer's name as an ID is not safe - multiple
  // WFS's may use the same name for two totally different layers.
  // So we need something more. Luckily, we can use the UID property
  // of our OL layer.
  const layerId = subLayerName + (layer?.ol_uid && "." + layer?.ol_uid);
  // Get caption for this dataset
  // If there are layer groups, we get the display name from the layer's caption.
  const displayName =
    layer?.layersInfo[subLayerName]?.caption ||
    layer?.get("caption") ||
    "Unnamed dataset";
  // Get infoclick definition for this dataset
  const infoclickDefinition = layer?.layersInfo?.[subLayerName]?.infobox || "";
  // Prepare the infoclick icon string
  const infoclickIcon = layer?.layersInfo?.[subLayerName]?.infoclickIcon || "";
  // Prepare displayFields, shortDisplayFields and secondaryLabelFields.
  // We need them to determine what should be displayed
  // in the features list view.
  const displayFields =
    layer?.layersInfo?.[subLayerName]?.searchDisplayName
      ?.split(",")
      .map((df) => df.trim()) || [];
  const shortDisplayFields =
    layer?.layersInfo?.[subLayerName]?.searchShortDisplayName
      ?.split(",")
      .map((df) => df.trim()) || [];
  const secondaryLabelFields =
    layer?.layersInfo?.[subLayerName]?.secondaryLabelFields
      ?.split(",")
      .map((df) => df.trim()) || [];

  return {
    subLayerName,
    layerId,
    displayName,
    infoclickDefinition,
    infoclickIcon,
    displayFields,
    shortDisplayFields,
    secondaryLabelFields,
  };
}
