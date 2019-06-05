import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";
import Typography from "@material-ui/core/Typography";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
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
    padding: "6px",
    marginBottom: "10px",
    background: "white"
  },
  resultGroup: {
    width: "100%"
  },
  expanded: {
    display: "block"
  },
  hidden: {
    display: "none"
  },
  badge: {},
  heading: {
    padding: 0,
    paddingRight: "14px",
    fontSize: "14pt",
    fontWeight: "500"
  },
  secondaryHeading: {
    fontSize: "10pt"
  },
  details: {
    padding: "8px 12px 12px",
    background: "#efefef",
    borderTop: "1px solid #ccc"
  },
  active: {
    background: theme.palette.primary.main
  },
  disableTransition: {
    transition: "none"
  },
  expansionPanel: {
    borderRadius: "0 !important"
  }
});

class SearchResultGroup extends Component {
  state = {
    selfExpanded: false
  };

  highlight = feature => e => {
    var olFeature = new GeoJSON().readFeatures(feature)[0];
    this.props.model.highlight(olFeature);
    if (window.innerWidth >= 1280) {
      this.props.parent.hide();
    }
    this.setState({
      activeFeature: feature
    });
    this.props.model.clearLayerList();
    this.props.model.app.globalObserver.publish("hideSearchPanel");
  };

  zoomTo = feature => e => {
    var olFeature = new GeoJSON().readFeatures(feature)[0];
    this.props.model.highlightFeature(olFeature);
    if (window.innerWidth >= 600) {
      this.props.parent.hide();
    }
    this.setState({
      activeFeature: feature
    });
    //this.props.localObserver.publish("minimizeWindow", true);
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

  renderItem(feature, displayField, infoBox, i) {
    const { classes, target } = this.props;
    const active = this.state.activeFeature === feature;

    return (
      <ExpansionPanel
        key={i}
        onClick={this.zoomTo(feature)}
        className={classNames(classes.item, active ? classes.active : null)}
      >
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <div style={{ flex: "auto", display: "flex" }}>
            <div>
              {feature.properties[displayField]}
              {target === "center" ? (
                <div>
                  <Button color="primary" onClick={this.highlight(feature)}>
                    Visa påverkan
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <div
            dangerouslySetInnerHTML={this.getHtmlItemInfoBox(feature, infoBox)}
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
            className={classes.disableTransition}
            ref={this.panelHeaderElement}
            onClick={this.toggle}
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography className={classes.heading}>
              {featureType.source.caption}
              &nbsp;
              <span className={classes.secondaryHeading}>
                ({featureType.features.length})
              </span>
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.details}>
            <div className={classes.resultGroup}>
              <div className={classes.resultGroup}>
                {featureType.features.map((feature, i) =>
                  this.renderItem(
                    featureType.features[i],
                    featureType.source.displayFields[0],
                    featureType.source.infobox,
                    i
                  )
                )}
              </div>
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}

export default withStyles(styles)(SearchResultGroup);
