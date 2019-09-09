import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import { withSnackbar } from "notistack";
import Typography from "@material-ui/core/Typography/Typography";

const styles = theme => ({
  anchor: {
    wordBreak: "break-all"
  }
});

class AnchorView extends React.PureComponent {
  state = {
    anchor: this.props.model.getAnchor()
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
  }

  componentDidMount() {
    this.localObserver.subscribe("mapUpdated", anchor => {
      this.setState({
        anchor: anchor
      });
    });
    this.setState({
      anchor: this.props.model.getAnchor()
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <Typography>
          Spara kartans synliga lager, aktuella zoomnivå och utbredning.
          <br />
          Högerklicka på knappen och välj "Kopiera länkadress" för att kopiera
          länken till urklipp.
        </Typography>
        <br />
        <Button variant="contained" target="_blank" href={this.state.anchor}>
          Länk till karta
        </Button>
        <p className={classes.anchor}>{this.state.anchor}</p>
      </>
    );
  }
}

AnchorView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(AnchorView));
