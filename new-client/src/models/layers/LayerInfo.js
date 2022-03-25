export default class LayerInfo {
  constructor(properties) {
    this.attribution = properties.attribution;
    this.caption = properties.caption;
    this.displayFields = properties.displayFields;
    this.secondaryLabelFields = properties.secondaryLabelFields;
    this.shortDisplayFields = properties.shortDisplayFields;
    this.infoclickIcon = properties.infoclickIcon;
    this.infoOwner = properties.infoOwner;
    this.infoText = properties.infoText;
    this.infoTitle = properties.infoTitle;
    this.infoUrl = properties.infoUrl;
    this.infoUrlText = properties.infoUrlText;
    this.infoVisible = properties.infoVisible;
    this.infoClickSortType = properties.infoClickSortType;
    this.infoClickSortDesc = properties.infoClickSortDesc;
    this.infoClickSortProperty = properties.infoClickSortProperty;
    this.information = properties.information;
    this.legend = properties.legend;
    this.legendIcon = properties.legendIcon;
    this.searchDisplayName = properties.searchDisplayName;
    this.searchShortDisplayName = properties.searchShortDisplayName;
    this.searchGeometryField = properties.searchGeometryField;
    this.searchOutputFormat = properties.searchOutputFormat;
    this.searchPropertyName = properties.searchPropertyName;
    this.searchUrl = properties.searchUrl;
    this.layerType = properties.layerType;
    this.hideExpandArrow = properties.hideExpandArrow;
    this.showAttributeTableButton = properties.showAttributeTableButton;
  }
}
