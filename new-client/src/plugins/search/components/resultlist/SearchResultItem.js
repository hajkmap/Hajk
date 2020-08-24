import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";
import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import KeyboardArrowDown from "@material-ui/icons/KeyboardArrowDown";
import Button from "@material-ui/core/Button";
import {
  extractPropertiesFromJson,
  mergeFeaturePropsWithMarkdown,
} from "../../../../utils/FeaturePropsParsing";

const styles = (theme) => ({
  item: {
    userSelect: "none",
    cursor: "pointer",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
    borderRadius: "2px",
    background: "#f0efef",
    margin: "0px",
  },
  button: {
    padding: 0,
  },

  details: {
    padding: "0px",
    background: "#efefef",
    borderTop: "1px solid #ccc",
  },
  activeAccordionSummary: {
    background: "#e1e1e1",
    fontWeight: "bold",
  },
  activeExpandButton: {
    color: "black",
  },
  AccordionDetails: {
    background: "white",
  },

  content: {
    "&$expanded": {
      margin: "0px",
    },
    margin: "0px",
  },

  featureMenu: {
    padding: "0px",
    "&:hover": {
      backgroundColor: "transparent",
    },
    "&:focus": {
      backgroundColor: "transparent",
    },
  },
  expanded: {
    margin: 0,
  },
});

class SearchResultItem extends Component {
  state = {
    expanded: false,
  };

  highlightImpact = (feature) => (e) => {
    var olFeature = new GeoJSON().readFeatures(feature)[0];
    this.props.model.highlightImpact(olFeature);
    if (window.innerWidth >= 1280) {
      this.props.searchResultList.hide();
    }
    this.props.model.clearLayerList();
  };

  zoomToHighLightedFeatures = () => {
    var features = this.props.highlightedFeatures.map((feature) => {
      var geoJsonFeature = new GeoJSON().readFeatures(feature)[0];
      geoJsonFeature.infobox = feature.infobox;
      return geoJsonFeature;
    });

    if (features.length > 0) {
      this.props.model.highlightFeatures(features);
    }
  };

  //TODO - Break up into smaller functions
  handleOnFeatureClick = (feature) => {
    var highlightedFeatures = this.props.highlightedFeatures;
    var indexOfHighlightedFeature = highlightedFeatures.indexOf(feature);

    // If so configured, auto hide the search results list
    this.props.model.options?.autoHideSearchResults &&
      this.props.searchResultList.hide();

    if (indexOfHighlightedFeature > -1) {
      var newHighlightedFeaturesArray = [...highlightedFeatures];
      newHighlightedFeaturesArray.splice(indexOfHighlightedFeature, 1);
      this.props.setHighlightedFeatures(newHighlightedFeaturesArray, () => {
        var featureAsGeoJson = new GeoJSON().readFeatures(feature)[0];
        this.props.model.clearFeatureHighlight(featureAsGeoJson);
        this.zoomToHighLightedFeatures();
      });
    } else {
      newHighlightedFeaturesArray = highlightedFeatures.concat([feature]);
      this.props.setHighlightedFeatures(newHighlightedFeaturesArray, () => {
        this.zoomToHighLightedFeatures();
      });
    }
  };

  clear = (e) => {
    this.props.model.clearLayerList();
    this.props.model.clearHighlight();
  };

  getHtmlItemInfoBox = (feature, infoBox) => {
    var properties = extractPropertiesFromJson(feature.properties);
    feature.properties = properties;
    return mergeFeaturePropsWithMarkdown(infoBox, feature.properties);
  };

  render() {
    const {
      feature,
      classes,
      displayFields,
      target,
      searchWithinButtonText,
    } = this.props;

    const active = this.props.highlightedFeatures.includes(feature);

    const ExpandIconWrapper = ({ children }) => (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (this.state.expanded) {
            this.setState({ expanded: false });
          } else {
            this.setState({ expanded: true });
          }
        }}
      >
        {children}
      </div>
    );

    return (
      <Accordion expanded={this.state.expanded} className={classes.item}>
        <AccordionSummary
          onClick={(e) => {
            this.handleOnFeatureClick(feature);
          }}
          classes={{
            expandIcon: classes.featureMenu,
            expanded: classes.expanded,
            content: classes.content,
          }}
          className={active ? classes.activeAccordionSummary : null}
          expandIcon={
            <ExpandIconWrapper>
              <KeyboardArrowDown
                className={active ? classes.activeExpandButton : null}
              />
            </ExpandIconWrapper>
          }
        >
          <div>
            <div>
              {displayFields
                .map((field) => feature.properties[field])
                .join(", ")}
              {target === "center" && this.props.renderAffectButton ? (
                <div>
                  <Button
                    color="primary"
                    onClick={this.highlightImpact(feature)}
                  >
                    {searchWithinButtonText || "Visa påverkan"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </AccordionSummary>
        <AccordionDetails className={classes.AccordionDetails}>
          <div
            dangerouslySetInnerHTML={this.getHtmlItemInfoBox(
              feature,
              feature.infobox
            )}
          />
        </AccordionDetails>
      </Accordion>
    );
  }
}

export default withStyles(styles)(SearchResultItem);
