import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import { Typography } from "@material-ui/core";

const styles = (theme) => ({
  drawerContent: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
});

class GeosuiteExportView extends React.PureComponent {
  state = {
    stage: 1, //stage of the form process we are in.
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired, //the classes prop is provided by the material UI theme.
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.map = props.map;
    this.localObserver = props.localObserver;
    this.bindSubscriptions();
  }

  //example subscriber that we might use when the map selection is complete.
  bindSubscriptions = () => {
    this.localObserver.subscribe("area-select-complete", () => {
      this.areaSelectionCompleted();
    });
  };

  areaSelectionCompleted = () => {
    console.log("The area is selected, let's build the WFS search");
    this.model.createWfsRequest();
  };

  render() {
    const { stage } = this.state;
    const { classes } = this.props;

    //the classes prop is added by MaterialUI when we export withStyles.
    console.log(classes);

    return (
      <>
        <Button></Button>
        <Typography>Information om verktyget</Typography>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(GeosuiteExportView));
