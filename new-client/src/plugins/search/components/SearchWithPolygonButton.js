import React from "react";
import { withStyles } from "@material-ui/core/styles";
import LoupeIcon from "@material-ui/icons/Loupe";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import Snackbar from "@material-ui/core/Snackbar";
import { createPortal } from "react-dom";

const styles = theme => {
  return {
    button: {},
    anchorOriginBottomCenter: {
      bottom: "60px"
    }
  };
};

class SearchWithPolygon extends React.Component {
  state = {
    active: false
  };

  render() {
    const { classes, buttonText } = this.props;
    return (
      <>
        <Tooltip title="Visa påverkan inom ett område">
          <Button
            className={classes.button}
            color={this.state.active ? "primary" : "default"}
            onClick={() => {
              this.setState(
                {
                  active: !this.state.active
                },
                () => {
                  this.props.model.toggleDraw(
                    this.state.active,
                    "Polygon",
                    false,
                    e => {
                      this.props.model.searchWithinArea(
                        e.feature,
                        false,
                        featureCollections => {
                          this.props.onComplete(featureCollections);
                        }
                      );
                    }
                  );
                  this.setState({
                    active: false
                  });
                  if (this.state.active) {
                    this.props.localObserver.publish("minimizeWindow", true);
                  }
                }
              );
            }}
          >
            <LoupeIcon />
            &nbsp; {buttonText}
          </Button>
        </Tooltip>
        {createPortal(
          <Snackbar
            className={classes.anchorOriginBottomCenter}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            open={this.state.active ? true : false}
            ContentProps={{
              "aria-describedby": "message-id"
            }}
            message={<span id="message-id">Rita en polygon</span>}
          />,
          document.getElementById("map-overlay")
        )}
      </>
    );
  }
}

export default withStyles(styles)(SearchWithPolygon);
