export default class LayerInfo {
  constructor(properties) {
    this.attribution = properties.attribution;
    this.caption = properties.caption;
    this.infoOwner = properties.infoOwner;
    this.infoText = properties.infoText;
    this.infoTitle = properties.infoTitle;
    this.infoUrl = properties.infoUrl;
    this.infoUrlText = properties.infoUrlText;
    this.infoVisible = properties.infoVisible;
    this.information = properties.information;
    this.legend = properties.legend;
    this.searchDisplayName = properties.searchDisplayName;
    this.searchGeometryField = properties.searchGeometryField;
    this.searchOutputFormat = properties.searchOutputFormat;
    this.searchPropertyName = properties.searchPropertyName;
    this.searchUrl = properties.searchUrl;
    this.layerType = properties.layerType;
    this.hideExpandArrow = properties.hideExpandArrow;
  }
}
