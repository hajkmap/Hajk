import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";
import Typography from "@material-ui/core/Typography";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import KeyboardArrowDown from "@material-ui/icons/KeyboardArrowDown";
import Button from "@material-ui/core/Button";
import {
  extractPropertiesFromJson,
  mergeFeaturePropsWithMarkdown
} from "../../../../utils/FeaturePropsParsing";

import classNames from "classnames";

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
  resultGroup: {
    width: "100%"
  },
  expanded2: {
    display: "block"
  },
  hidden: {
    display: "none"
  },
  button: {
    padding: 0
  },
  badge: {},
  heading: {
    padding: 0,
    paddingRight: "14px",
    color: "white",
    fontWeight: "500"
  },
  secondaryHeading: {
    fontSize: "10pt",
    color: "black",
    backgroundColor: "white",
    padding: "3px",
    borderRadius: "3px"
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
  activeExpansionPanelDetails: {
    background: "#e1e1e1"
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
  itemRoot: {
    minHeight: 0,
    padding: 5,
    "&$expanded": {
      minHeight: 0
    }
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
  groupRoot: {
    minHeight: "0px",
    padding: "5px",
    "&$expanded": {
      minHeight: 0
    }
  },
  expanded: {
    margin: 0
  },
  expansionPanel: {
    borderRadius: "0 !important",
    height: "30%",
    backgroundColor: "#0076bc"
  }
});

class SearchResultGroup extends Component {
  state = {
    selfExpanded: false,
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
    console.log(feature, "feature");
    var highlightedFeatures = this.props.highlightedFeatures;

    var indexOfHighlightedFeature = highlightedFeatures.indexOf(feature);

    if (indexOfHighlightedFeature > -1) {
      var newHighlightedFeaturesArray = [...highlightedFeatures];
      newHighlightedFeaturesArray.splice(indexOfHighlightedFeature, 1);
      this.props.setHighlightedFeatures(newHighlightedFeaturesArray, () => {
        var featureAsGeoJson = new GeoJSON().readFeatures(feature)[0];
        console.log(featureAsGeoJson, "featureAsGeo");
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

  renderItem(feature, displayField, i) {
    const { classes, target } = this.props;
    var active =
      this.props.highlightedFeatures
        .map(highlightedFeature => {
          return highlightedFeature;
        })
        .indexOf(feature) > -1;

    return (
      <ExpansionPanel
        key={i}
        onClick={e => {
          this.handleOnFeatureClick(feature);
        }}
        expanded={this.state.expanded === i}
        className={classes.item}
      >
        <ExpansionPanelSummary
          classes={{
            expandIcon: classes.featureMenu,
            expanded: classes.expanded,
            content: classes.content
          }}
          className={active ? classes.activeExpansionPanelSummary : null}
          expandIcon={
            <Button className={classes.button}>
              <KeyboardArrowDown
                className={active ? classes.active : classes.expandButton}
                onClick={e => {
                  e.stopPropagation();
                  if (this.state.expanded === i) {
                    this.setState({ expanded: -1 });
                  } else {
                    this.setState({ expanded: i });
                  }
                }}
                key={i}
              />
            </Button>
          }
        >
          <div style={{ flex: "auto", display: "flex" }}>
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
        <ExpansionPanelDetails
          className={active ? classes.activeExpansionPanelDetails : null}
        >
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

  toggle = e => {
    this.setState({
      selfExpanded: !this.state.selfExpanded
    });
  };

  render() {
    const { featureType, classes } = this.props;
    const { selfExpanded } = this.state;
    var { expanded } = this.props;

    if (selfExpanded) {
      expanded = true;
    }

    var items = featureType.features.map((feature, i) => {
      //Putting infobox on feature instead of layer due to searchresult sharing same vectorlayer
      featureType.features[i].infobox = featureType.source.infobox;
      return this.renderItem(
        featureType.features[i],
        featureType.source.displayFields[0],
        i
      );
    });

    return (
      <div ref="panelElement">
        <ExpansionPanel
          className={classes.expansionPanel}
          expanded={expanded}
          onChange={e => {
            setTimeout(() => {
              this.refs.panelElement.scrollIntoView();
            }, 100);
          }}
        >
          <ExpansionPanelSummary
            classes={{
              expanded: classes.expanded,
              content: classes.content
            }}
            className={classes.groupRoot}
            ref={this.panelHeaderElement}
            onClick={this.toggle}
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography variant="subtitle1" className={classes.heading}>
              {featureType.source.caption}
              &nbsp;
              <span className={classes.secondaryHeading}>
                {featureType.features.length}
              </span>
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.details}>
            <div className={classes.resultGroup}>
              <div className={classes.resultGroup}>{items}</div>
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}

export default withStyles(styles)(SearchResultGroup);
