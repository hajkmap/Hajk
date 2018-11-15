import React, { Component } from "react";
import LayerItem from "./LayerItem.js";
import { withStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  root: {
    width: "100%",
    display: "block",
    padding: "5px 0",
    borderTop: "1px solid #ccc",
    background: "#efefef"
  },
  heading: {
    fontSize: theme.typography.pxToRem(18),
    flexBasis: "100%",
    flexShrink: 0
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary
  },
  disableTransition: {
    transition: "none"
  },
  panel: {
    marginLeft: "10px"
  }
});

class LayerGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      groups: [],
      layers: [],
      name: "",
      parent: "-1",
      toggled: false,
      chapters: []
    };
    this.toggleExpanded = this.toggleExpanded.bind(this);
    props.app.globalObserver.on("informativeLoaded", chapters => {
      this.setState({
        chapters: chapters
      });
    });
  }

  componentDidMount() {
    this.setState({
      ...this.state,
      ...this.props.group
    });
    this.model = this.props.model;
  }

  handleChange = panel => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false
    });
  };

  renderLayerGroups() {
    const { expanded } = this.state;
    const { classes } = this.props;
    return this.state.groups.map((group, i) => {
      return (
        <LayerGroup
          expanded={expanded === group.id}
          key={i}
          group={group}
          model={this.props.model}
          handleChange={this.handleChange}
          app={this.props.app}
          classes={classes}
        />
      );
    });
  }

  toggleExpanded() {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    const { classes } = this.props;

    return (
      <div ref="panelElement" className={classes.panel}>
        <ExpansionPanel
          className={classes.disableTransition}
          CollapseProps={{ classes: { container: classes.disableTransition } }}
          expanded={this.props.expanded}
          onChange={this.props.handleChange(this.props.group.id, this)}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>
              {this.state.name}
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails classes={{ root: classes.root }}>
            {this.state.layers.map((layer, i) => {
              var mapLayer = this.model.layerMap[Number(layer.id)];
              if (mapLayer) {
                return (
                  <LayerItem
                    key={i}
                    layer={mapLayer}
                    chapters={this.state.chapters}
                    onOpenChapter={chapter => {
                      var informativePanel = this.props.app.panels.find(
                        panel => panel.type === "informative"
                      );
                      informativePanel.open(chapter);
                    }}
                  />
                );
              } else {
                return null;
              }
            })}
            {this.renderLayerGroups()}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroup);
