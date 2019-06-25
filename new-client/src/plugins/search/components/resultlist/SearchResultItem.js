import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import KeyboardArrowDown from "@material-ui/icons/KeyboardArrowDown";
import Button from "@material-ui/core/Button";
import {
  extractPropertiesFromJson,
  mergeFeaturePropsWithMarkdown
} from "../../../../utils/FeaturePropsParsing";

const styles = theme => ({
  item: {
    userSelect: "none",
    cursor: "pointer",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
    borderRadius: "2px",
    background: "#f0efef",
    margin: "0px"
  },
  button: {
    padding: 0
  },

  details: {
    padding: "0px",
    background: "#efefef",
    borderTop: "1px solid #ccc"
  },
  activeExpansionPanelSummary: {
    background: "#e1e1e1",
    fontWeight: "bold"
  },
  expansionPanelDetails: {
    background: "white"
  },

  expandButton: {
    color: "grey"
  },
  content: {
    "&$expanded": {
      margin: "0px"
    },
    margin: "0px"
  },

  featureMenu: {
    padding: "0px",
    "&:hover": {
      backgroundColor: "transparent"
    },
    "&:focus": {
      backgroundColor: "transparent"
    }
  },
  expanded: {
    margin: 0
  }
});

class SearchResultItem extends Component {
  state = {
    expanded: false
  };

  highlightImpact = feature => e => {
    var olFeature = new GeoJSON().readFeatures(feature)[0];
    this.props.model.highlightImpact(olFeature);
    if (window.innerWidth >= 1280) {
      this.props.parent.hide();
    }

    this.props.model.clearLayerList();
    this.props.model.app.globalObserver.publish("hideSearchPanel");
  };

  zoomTo = () => {
    var features = this.props.highlightedFeatures.map(feature => {
      var geoJsonFeature = new GeoJSON().readFeatures(feature)[0];
      geoJsonFeature.infobox = feature.infobox;
      return geoJsonFeature;
    });

    if (features.length > 0) {
      this.props.model.highlightFeatures(features);
      if (window.innerWidth >= 600) {
        //this.props.parent.hide();
      }
    }
  };

  handleOnFeatureClick = feature => {
    var highlightedFeatures = this.props.highlightedFeatures;

    var indexOfHighlightedFeature = highlightedFeatures.indexOf(feature);

    if (indexOfHighlightedFeature > -1) {
      var newHighlightedFeaturesArray = [...highlightedFeatures];
      newHighlightedFeaturesArray.splice(indexOfHighlightedFeature, 1);
      this.props.setHighlightedFeatures(newHighlightedFeaturesArray, () => {
        var featureAsGeoJson = new GeoJSON().readFeatures(feature)[0];
        this.props.model.clearFeatureHighlight(featureAsGeoJson);
        this.zoomTo();
      });
    } else {
      newHighlightedFeaturesArray = highlightedFeatures.concat([feature]);
      this.props.setHighlightedFeatures(newHighlightedFeaturesArray, () => {
        this.zoomTo();
      });
    }
  };

  clear = e => {
    this.props.model.clearLayerList();
    this.props.model.clearHighlight();
  };

  getHtmlItemInfoBox = (feature, infoBox) => {
    var properties = extractPropertiesFromJson(feature.properties);
    feature.properties = properties;
    return mergeFeaturePropsWithMarkdown(infoBox, feature.properties);
  };

  render() {
    const { feature, classes, displayField, target } = this.props;
    var active =
      this.props.highlightedFeatures
        .map(highlightedFeature => {
          return highlightedFeature;
        })
        .indexOf(feature) > -1;

    const ExpandIconWrapper = ({ children }) => (
      <div
        onClick={e => {
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
      <ExpansionPanel expanded={this.state.expanded} className={classes.item}>
        <ExpansionPanelSummary
          onClick={e => {
            this.handleOnFeatureClick(feature);
          }}
          classes={{
            expandIcon: classes.featureMenu,
            expanded: classes.expanded,
            content: classes.content
          }}
          className={active ? classes.activeExpansionPanelSummary : null}
          expandIcon={
            <ExpandIconWrapper>
              <KeyboardArrowDown
                className={active ? classes.active : classes.expandButton}
              />
            </ExpandIconWrapper>
          }
        >
          <div>
            <div>
              {feature.properties[displayField]}
              {target === "center" && this.props.renderAffectButton ? (
                <div>
                  <Button
                    color="primary"
                    onClick={this.highlightImpact(feature)}
                  >
                    Visa påverkan
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.expansionPanelDetails}>
          <div
            dangerouslySetInnerHTML={this.getHtmlItemInfoBox(
              feature,
              feature.infobox
            )}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default withStyles(styles)(SearchResultItem);
