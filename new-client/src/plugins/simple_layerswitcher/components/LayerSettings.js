import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Slider from "@material-ui/lab/Slider";
import VectorFilter from "./VectorFilter";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  sliderContainer: {
    padding: "30px",
    overflow: "hidden"
  },
  icon: {
    cursor: "pointer"
  },
  settingsContainer: {
    overflow: "hidden",
    paddingLeft: "30px",
    paddingRight: "30px",
    paddingBottom: "30px"
  },
  subtitle2: {
    fontWeight: 500
  }
});

class LayerSettings extends React.PureComponent {
  constructor(props) {
    super(props);
    const { layer } = props;
    var layerInfo = layer.get("layerInfo");
    this.state = {
      opacityValue: props.layer.get("opacity"),
      legend: layerInfo.legend
    };
    props.layer.on("change:opacity", this.updateOpacity);
  }

  updateOpacity = e => {
    var o = e.target.getOpacity();
    if (o === 0 || o === 1) {
      this.setState({
        opacityValue: o
      });
    }
  };

  renderOpacitySlider() {
    let opacityValue = this.state.opacityValue;
    const { classes } = this.props;
    return (
      <div>
        <Typography className={classes.subtitle2} variant="subtitle2">
          Opacitet
        </Typography>
        <Slider
          classes={{ container: classes.sliderContainer }}
          value={opacityValue}
          min={0}
          max={1}
          step={0.1}
          onChange={this.opacitySliderChanged}
        />
      </div>
    );
  }

  /* This function does two things:
   * 1) it updates opacityValue, which is in state,
   *    and is important as <Slider> uses it to set
   *    its internal value.
   * 2) it changes OL layer's opacity
   *
   * As <Slider> is set up to return a value between
   * 0 and 1 and it has a step of 0.1, we don't have
   * to worry about any conversion and rounding here.
   * */
  opacitySliderChanged = (event, opacityValue) => {
    this.setState({ opacityValue }, () => {
      this.props.layer.setOpacity(this.state.opacityValue);
    });
  };

  toggle = e => {
    this.setState({
      toggled: !this.state.toggled
    });
  };

  renderSettings() {
    return (
      <div>
        <div className={this.props.classes.settingsContainer}>
          {this.props.showOpacity ? this.renderOpacitySlider() : null}
          {this.props.showLegend ? this.renderLegendImage() : null}
          {this.props.layer.getProperties().filterable ? (
            <VectorFilter layer={this.props.layer} />
          ) : null}
        </div>
      </div>
    );
  }

  renderLegendImage() {
    const { classes } = this.props;
    var index = this.props.index ? this.props.index : 0;

    var src =
      this.state.legend[index] && this.state.legend[index].url
        ? this.state.legend[index].url
        : "";
    return src ? (
      <div>
        <Typography className={classes.subtitle2} variant="subtitle2">
          Teckenförklaring
        </Typography>
        <img width="55px" alt="Teckenförklaring" src={src} />
      </div>
    ) : null;
  }

  render() {
    return (
      <div>
        <div>{this.props.toggled ? this.renderSettings() : null}</div>
      </div>
    );
  }
}

export default withStyles(styles)(LayerSettings);
