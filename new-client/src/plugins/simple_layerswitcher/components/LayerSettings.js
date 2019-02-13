import React from "react";
import { withStyles } from "@material-ui/core/styles";
import IconMoreHoriz from "@material-ui/icons/MoreHoriz";
import Slider from "@material-ui/lab/Slider";

const styles = theme => ({
  sliderContainer: {
    padding: "30px",
    overflow: "hidden"
  }
});

class LayerSettings extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      opacityValue: 1
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
      <>
        <Slider
          classes={{ container: classes.slider }}
          value={opacityValue}
          min={0}
          max={1}
          step={0.1}
          onChange={this.opacitySliderChanged}
        />
      </>
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
      <div className={this.props.classes.sliderContainer}>
        {this.renderOpacitySlider()}
      </div>
    );
  }

  render() {
    return (
      <div>
        <div>
          <IconMoreHoriz onClick={this.toggle} />
        </div>
        <div>{this.state.toggled ? this.renderSettings() : null}</div>
      </div>
    );
  }
}

export default withStyles(styles)(LayerSettings);
