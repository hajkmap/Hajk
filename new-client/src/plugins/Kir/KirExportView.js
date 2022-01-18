import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

import FirExportResidentListView from "../Fir/FirExportResidentListView";

const styles = (theme) => ({
  info: {
    padding: theme.spacing(2),
  },
  num: {
    fontWeight: 500,
    fontSize: "1rem",
  },
  heading: {
    fontWeight: 500,
  },
  formControl: {
    marginBottom: theme.spacing(3),
  },
  formControlOneMargin: {
    marginBottom: theme.spacing(1),
  },
  checkboxLabel: {
    fontSize: "0.875rem",
    fontWeight: "400",
  },
  checkbox: {
    paddingTop: "0.25rem",
    paddingBottom: "0.25rem",
  },
  checkboxGroupContainer: {
    paddingBottom: theme.spacing(2),
  },
  containerTopPadded: {
    paddingTop: theme.spacing(2),
  },
  containerTopDoublePadded: {
    paddingTop: theme.spacing(4),
  },
  textField: {
    width: "50%",
  },
});
class KirExportView extends React.PureComponent {
  state = {
    results: [],
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;

    this.localObserver.subscribe("kir.results.filtered", (list) => {
      this.setState({ results: [...list] });
      this.forceUpdate();
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.root}>
          <div className={classes.info}>
            <span className={classes.num}>{this.state.results.length}</span>{" "}
            objekt finns tillgängliga för export.
          </div>
          {this.model.app.plugins.fir.options.residentList ? (
            <FirExportResidentListView
              results={this.state.results}
              model={this.model}
              app={this.props.app}
              localObserver={this.localObserver}
              type={"kir"}
            />
          ) : (
            ""
          )}
        </div>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(KirExportView));
