import React from "react";
import VectorFilter from "./VectorFilter";
import CQLFilter from "./CQLFilter";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import { styled } from "@mui/material/styles";

const SettingsContainer = styled("div")(({ theme }) => ({
  overflow: "hidden",
  paddingLeft: "45px",
  paddingRight: "30px",
  paddingBottom: "10px",
  paddingTop: "10px",
}));

const SliderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexFlow: "row nowrap",
  alignItems: "center",
}));

const SliderTextWrapper = styled("div")(({ theme }) => ({
  flex: "0 1 auto",
  minWidth: "40px",
}));

const SliderWrapper = styled("div")(({ theme }) => ({
  padding: "0 16px",
  flex: "1 1 auto",
  "& > span": {
    top: "4px",
  },
}));

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
    return (
      <SliderContainer>
        <SliderTextWrapper>
          <Typography variant="subtitle2">Opacitet:</Typography>
        </SliderTextWrapper>
        <SliderWrapper>
          <Slider
            size="small"
            value={opacityValue}
            min={0}
            max={1}
            step={0.05}
            onChange={this.opacitySliderChanged}
          />
        </SliderWrapper>
        <SliderTextWrapper>
          <Typography variant="subtitle2">
            {Math.trunc(100 * opacityValue.toFixed(2))} %
          </Typography>
        </SliderTextWrapper>
      </SliderContainer>
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
        <SettingsContainer>
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
        </SettingsContainer>
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

export default LayerSettings;
