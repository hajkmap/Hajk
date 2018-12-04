import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import { withSnackbar } from "notistack";

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
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
  }

  componentDidMount() {
    this.localObserver.subscribe("mapUpdated", anchor => {
      if (this.props.parent.state.panelOpen) {
        this.setState({
          anchor: anchor
        });
      }
    });
    this.setState({
      anchor: this.props.model.getAnchor()
    });
  }

  componentWillUnmount() {
    this.localObserver.unsubscribe("mapUpdated");
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <p>
          Kartans synliga lager och aktuella zoomnivå och utbredning är.
          Högerklicka på knappen och välj spara länk för att kopiera länken till
          urklipp.
        </p>
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
