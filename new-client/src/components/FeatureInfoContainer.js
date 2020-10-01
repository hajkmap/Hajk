import React from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import FeatureInfo from "./FeatureInfo";
import Grid from "@material-ui/core/Grid";
import { ButtonGroup, Button } from "@material-ui/core";

const styles = (theme) => ({});

class FeatureInfoContainer extends React.PureComponent {
  state = {
    selectedIndex: 0,
  };

  static propTypes = {
    classes: propTypes.object.isRequired,
    features: propTypes.array.isRequired,
    onDisplay: propTypes.func.isRequired,
  };

  componentDidMount() {}

  stepLeft = () => {
    if (this.state.selectedIndex - 1 > -1) {
      this.setState(
        (prevState) => {
          return { selectedIndex: prevState.selectedIndex - 1 };
        },
        () => {
          this.props.onDisplay(
            this.props.features[this.state.selectedIndex - 1]
          );
        }
      );
    }
  };

  stepRight = () => {
    const { features } = this.props;
    if (this.state.selectedIndex + 1 < features.length) {
      this.setState(
        (prevState) => {
          return { selectedIndex: prevState.selectedIndex + 1 };
        },
        () => {
          this.props.onDisplay(
            this.props.features[this.state.selectedIndex - 1]
          );
        }
      );
    }
  };

  getStepButton = (onClickFunction, icon, disabled) => {
    return (
      <Button
        disabled={disabled}
        style={{ width: "20%" }}
        onClick={onClickFunction}
        aria-label="Previous"
        id="step-left"
      >
        {icon}
      </Button>
    );
  };

  getToggler = () => {
    const { features } = this.props;
    return (
      <>
        <ButtonGroup
          fullWidth
          style={{ display: "flex", justifyContent: "space-between" }}
          aria-label="Browse through infoclick results"
          color="primary"
          size="small"
          variant="contained"
        >
          {this.getStepButton(
            this.stepLeft,
            <ArrowLeftIcon />,
            this.state.selectedIndex - 1 < 0
          )}
          {this.getStepButton(
            this.stepRight,
            <ArrowRightIcon />,
            this.state.selectedIndex + 1 >= features.length
          )}
        </ButtonGroup>
      </>
    );
  };

  render() {
    const { features } = this.props;
    return (
      <Grid direction="column" container>
        <Grid item>{this.getToggler()}</Grid>
        <Grid item>
          <FeatureInfo
            feature={features[this.state.selectedIndex]}
          ></FeatureInfo>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(FeatureInfoContainer);
