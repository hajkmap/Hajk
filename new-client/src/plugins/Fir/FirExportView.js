import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import FirExportEdpView from "./FirExportEdpView";
import FirExportPropertyListView from "./FirExportPropertyListView";
import FirExportResidentListView from "./FirExportResidentListView";

class FirExportView extends React.PureComponent {
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

    this.localObserver.subscribe("fir.results.filtered", (list) => {
      this.setState({ results: [...list] });
      this.forceUpdate();
    });
  }

  ExcelLogo() {
    return (
      <img src="/excel.svg" alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  handleHousingListClick() {
    console.log("Skapa boendeförteckning");
  }

  handleRealestateListClick() {
    console.log("Skapa fastighetsförteckning");
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

          <FirExportPropertyListView
            results={this.state.results}
            model={this.model}
            app={this.app}
            localObserver={this.localObserver}
          />

          <FirExportResidentListView
            results={this.state.results}
            model={this.model}
            app={this.app}
            localObserver={this.localObserver}
          />

          <FirExportEdpView
            results={this.state.results}
            model={this.model}
            app={this.app}
            localObserver={this.localObserver}
          />
        </div>
      </>
    );
  }
}

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

export default withStyles(styles)(withSnackbar(FirExportView));
