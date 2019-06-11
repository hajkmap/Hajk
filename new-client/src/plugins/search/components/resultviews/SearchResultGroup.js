import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";
import Typography from "@material-ui/core/Typography";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
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
    background: "white",
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
    fontSize: "10pt"
  },
  details: {
    padding: "0px",
    background: "#efefef",
    borderTop: "1px solid #ccc"
  },
  active: {
    background: theme.palette.primary.main
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
      //this.props.parent.hide();
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
        expanded={this.state.expanded === i}
        className={classNames(classes.item, active ? classes.active : null)}
      >
        <ExpansionPanelSummary
          classes={{
            expandIcon: classes.featureMenu,
            expanded: classes.expanded,
            content: classes.content
          }}
          className={classes.itemRoot}
          expandIcon={
            <Button className={classes.button}>
              <MoreHorizIcon
                onClick={() => {
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
