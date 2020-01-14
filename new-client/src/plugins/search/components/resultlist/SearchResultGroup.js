import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import SearchResultItem from "./SearchResultItem";

const styles = theme => ({
  resultGroup: {
    width: "100%"
  },
  heading: {
    padding: 0,
    paddingRight: "14px",
    color: theme.palette.primary.contrastText,
    fontWeight: "500"
  },
  secondaryHeading: {
    fontSize: "10pt",
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.contrastText,
    padding: "3px 6px 3px 6px",
    borderRadius: "30%"
  },
  details: {
    padding: "0px",
    background: "#efefef",
    borderTop: "1px solid #ccc"
  },
  content: {
    "&$expanded": {
      margin: "0px"
    },
    margin: "0px"
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
    margin: "5px 0",
    backgroundColor: theme.palette.primary.main
  }
});

class SearchResultGroup extends Component {
  state = {
    selfExpanded: false,
    expanded: false
  };

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
      return (
        <SearchResultItem
          key={i}
          searchResultList={this.props.parent}
          renderAffectButton={this.props.renderAffectButton}
          searchWithinButtonText={
            this.props.model.options.searchWithinButtonText
          }
          model={this.props.model}
          target={this.props.target}
          feature={featureType.features[i]}
          highlightedFeatures={this.props.highlightedFeatures}
          setHighlightedFeatures={this.props.setHighlightedFeatures}
          displayFields={featureType.source.displayFields}
        />
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
          TransitionProps={{ timeout: 200 }}
        >
          <ExpansionPanelSummary
            classes={{
              expanded: classes.expanded,
              content: classes.content
            }}
            className={classes.groupRoot}
            ref={this.panelHeaderElement}
            onClick={this.toggle}
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
            <div className={classes.resultGroup}>{items}</div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}

export default withStyles(styles)(SearchResultGroup);
