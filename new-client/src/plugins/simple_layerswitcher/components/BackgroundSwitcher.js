import React from "react";
import { withStyles } from "@material-ui/core/styles";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Typography from "@material-ui/core/Typography";
import Radio from "@material-ui/core/Radio";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";

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
  },
  row: {
    background: "white"
  },
  layerItemContainer: {
    padding: "10px",
    margin: "5px",
    background: "white",
    borderTopRightRadius: "10px",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)"
  },
  captionText: {
    marginLeft: "-6px",
    position: "relative",
    top: "2px"
  }
});

class BackgroundSwitcher extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedLayer: -1,
      toggled: true
    };
  }

  onChange = e => {
    if (Number(this.state.selectedLayer) > 0) {
      this.props.layerMap[Number(this.state.selectedLayer)].setVisible(false);
    }
    if (Number(e.target.value) > 0) {
      this.props.layerMap[Number(e.target.value)].setVisible(true);
    }

    if (e.target.value === "-2") {
      document.getElementById("map").style.backgroundColor = "#000";
    } else {
      document.getElementById("map").style.backgroundColor = "#FFF";
    }

    this.setState({
      selectedLayer: e.target.value
    });
  };

  componentDidMount() {
    const { layers } = this.props;
    layers
      .filter(layer => layer.visible)
      .forEach((layer, i) => {
        if (i !== 0 && this.props.layerMap[Number(layer.name)]) {
          this.props.layerMap[Number(layer.name)].setVisible(false);
        } else {
          this.setState({
            selectedLayer: layer.name
          });
        }
      });
  }

  renderRadioButton(config, index) {
    var caption,
      checked,
      mapLayer = this.props.layerMap[Number(config.name)];

    const { classes } = this.props;

    if (mapLayer) {
      caption = mapLayer.get("layerInfo").caption;
    } else {
      caption = config.caption;
    }
    checked = this.state.selectedLayer === config.name;
    return (
      <div key={index} className={classes.layerItemContainer}>
        <Radio
          id={caption + "_" + index}
          checked={checked}
          onChange={this.onChange}
          value={config.name || config}
          color="default"
          name="radio-button-demo"
          icon={<RadioButtonUncheckedIcon fontSize="small" />}
          checkedIcon={<RadioButtonCheckedIcon fontSize="small" />}
        />
        <label htmlFor={caption + "_" + index} className={classes.captionText}>
          <strong>{caption}</strong>
        </label>
      </div>
    );
  }

  renderBaseLayerComponents() {
    const { backgroundSwitcherWhite, backgroundSwitcherBlack } = this.props;
    var radioButtons = [],
      defaults = [];

    if (backgroundSwitcherWhite) {
      defaults.push(
        this.renderRadioButton(
          {
            name: "-1",
            caption: "Vit"
          },
          -1
        )
      );
    }
    if (backgroundSwitcherBlack) {
      defaults.push(
        this.renderRadioButton(
          {
            name: "-2",
            caption: "Svart"
          },
          -2
        )
      );
    }

    radioButtons = [...radioButtons, ...[defaults]];

    radioButtons = [
      ...radioButtons,
      ...this.props.layers.map((layerConfig, i) =>
        this.renderRadioButton(layerConfig, i)
      )
    ];

    return radioButtons;
  }

  getVisibilityClass() {
    return this.state.toggled ? "layers-list hidden" : "layers-list";
  }

  toggleVisibility() {
    this.setState({ toggled: !this.state.toggled });
  }

  getToggleIcon() {
    return this.state.toggled ? <ChevronRightIcon /> : <ExpandLessIcon />;
  }

  render() {
    const { classes } = this.props;
    return (
      <ExpansionPanel
        className={classes.disableTransition}
        CollapseProps={{ classes: { container: classes.disableTransition } }}
      >
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className={classes.heading}>Bakgrundskartor</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails classes={{ root: classes.root }}>
          {this.renderBaseLayerComponents()}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default withStyles(styles)(BackgroundSwitcher);
