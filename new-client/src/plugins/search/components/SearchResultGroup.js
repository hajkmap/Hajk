import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";
import Typography from "@material-ui/core/Typography";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";

const styles = theme => ({
  item: {
    userSelect: "none",
    cursor: "pointer",
    boxShadow: "0px 1px 2px 1px rgba(0, 0, 0, 0.22)",
    borderRadius: "2px",
    padding: "4px",
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
  };

  clear = e => {
    this.props.model.clearLayerList();
    this.props.model.clearHighlight();
  };

  componentWillMount() {}

  createItem(feature, displayField, i) {
    const { classes } = this.props;
    return (
      <div key={i} className={classes.item}>
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
            <p>
              <Button variant="contained" onClick={this.clear}>
                Rensa
              </Button>
            </p>
            <div className={classes.resultGroup}>
              {featureType.features.map((feature, i) =>
                this.createItem(
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
