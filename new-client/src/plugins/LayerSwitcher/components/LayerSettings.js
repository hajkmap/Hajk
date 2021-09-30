import React from "react";
import VectorFilter from "./VectorFilter";
import CQLFilter from "./CQLFilter";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import withStyles from "@mui/styles/withStyles";

const styles = (theme) => ({
  sliderContainer: {
    display: "flex",
    flexFlow: "row nowrap",
    alignItems: "center",
  },
  icon: {
    cursor: "pointer",
  },
  settingsContainer: {
    overflow: "hidden",
    paddingLeft: "45px",
    paddingRight: "30px",
    paddingBottom: "10px",
    paddingTop: "10px",
  },
  subtitle2: {
    fontWeight: 500,
  },
  sliderItem: {
    padding: "0 16px",
    flex: "1 1 auto",
    "& > span": {
      top: "4px",
    },
  },
  sliderText: {
    flex: "0 1 auto",
    minWidth: "40px",
  },
});

class LayerSettings extends React.PureComponent {
  constructor(props) {
    super(props);

    const { layer } = props;
    const layerInfo = layer.get("layerInfo");

    this.state = {
      opacityValue: layer.get("opacity"),
      legend: layerInfo.legend,
    };

    // Ensure that state is updated when OL Layer's opacity changes
    layer.on?.("change:opacity", this.updateOpacity);
  }

  // Ensure that opacity slider's value gets updated when
  // opacity is changed programmatically (e.g. via BreadCrumbs)
  updateOpacity = (e) => {
    const opacityValue = e.target.getOpacity();
    this.setState({
      opacityValue,
    });
  };

  renderOpacitySlider() {
    const opacityValue = this.state.opacityValue;
    const { classes } = this.props;
    return (
      <div className={classes.sliderContainer}>
        <div className={classes.sliderText}>
          <Typography className={classes.subtitle2} variant="subtitle2">
            Opacitet:
          </Typography>
        </div>
        <div className={classes.sliderItem}>
          <Slider
            value={opacityValue}
            min={0}
            max={1}
            step={0.05}
            onChange={this.opacitySliderChanged}
          />
        </div>
        <div className={classes.sliderText}>
          <Typography className={classes.subtitle2} variant="subtitle2">
            {Math.trunc(100 * opacityValue.toFixed(2))} %
          </Typography>
        </div>
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
    this.props.layer.setOpacity(opacityValue);
  };

  toggle = (e) => {
    this.setState({
      toggled: !this.state.toggled,
    });
  };

  renderSettings() {
    return (
      <div>
        <div className={this.props.classes.settingsContainer}>
          {this.props.options?.enableTransparencySlider !== false &&
          this.props.showOpacity
            ? this.renderOpacitySlider()
            : null}
          {this.props.showLegend ? this.renderLegendImage() : null}
          {this.props.layer.getProperties().filterable ? (
            <VectorFilter layer={this.props.layer} />
          ) : null}
          {this.props.cqlFilterVisible && (
            <CQLFilter layer={this.props.layer} />
          )}
        </div>
      </div>
    );
  }

  renderLegendImage() {
    const index = this.props.index ? this.props.index : 0;
    const src = this.state.legend?.[index]?.url ?? "";

    return src ? (
      <div>
        <img max-width="250px" alt="Teckenförklaring" src={src} />
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
