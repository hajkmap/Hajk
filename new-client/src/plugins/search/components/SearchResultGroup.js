import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";
import Typography from "@material-ui/core/Typography";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import classNames from "classnames";

const styles = theme => ({
  item: {
    userSelect: "none",
    cursor: "pointer",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
    borderRadius: "2px",
    padding: "6px",
    marginBottom: "10px"
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
    fontWeight: "500",
    marginBottom: "5px"
  },
  secondaryHeading: {
    fontSize: "10pt"
  },
  details: {
    padding: "8px 12px 12px"
  },
  active: {
    background: theme.palette.secondary.main
  }
});

class SearchResultGroup extends Component {
  state = {
    selfExpanded: false
  };

  highlight = feature => e => {
    var olFeature = new GeoJSON().readFeatures(feature)[0];
    this.props.model.highlight(olFeature);
    this.props.parent.hide();
    this.setState({
      activeFeature: feature
    });
    this.props.model.clearLayerList();
  };

  zoomTo = feature => e => {
    var olFeature = new GeoJSON().readFeatures(feature)[0];
    this.props.model.highlightFeature(olFeature);
    this.props.parent.hide();
    this.setState({
      activeFeature: feature
    });
  };

  clear = e => {
    this.props.model.clearLayerList();
    this.props.model.clearHighlight();
  };

  componentWillMount() {}

  renderItem(feature, displayField, i) {
    const { classes } = this.props;
    const active = this.state.activeFeature === feature;
    return (
      <div
        key={i}
        className={classNames(classes.item, active ? classes.active : null)}
        onClick={this.zoomTo(feature)}
      >
        {feature.properties[displayField]}
        <div>
          <Button color="primary" onClick={this.highlight(feature)}>
            Visa påverkan
          </Button>
        </div>
      </div>
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
      <ExpansionPanel expanded={expanded}>
        <ExpansionPanelSummary
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
                  i
                )
              )}
            </div>
          </div>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default withStyles(styles)(SearchResultGroup);
