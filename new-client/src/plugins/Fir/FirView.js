import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import FirSearchView from "./FirSearchView";
import FirExportView from "./FirExportView";
import FirSearchNeighborView from "./FirSearchNeighborView";
import FirSearchResultsView from "./FirSearchResultsView";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";

class FirView extends React.PureComponent {
  state = {
    activeTab: 0,
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

    this.localObserver.subscribe("fir.search.error", (err) => {
      this.props.closeSnackbar(this.snackBar);
      this.snackBar = this.props.enqueueSnackbar(
        `Ett fel inträffade vid sökningen.\n ${err.name}: ${err.message}`,
        {
          variant: "error",
          style: { whiteSpace: "pre-line" },
        }
      );
    });
  }

  handleChangeTabs = (event, activeTab) => {
    this.setState({ activeTab });
  };

  handleTabsMounted = (ref) => {
    setTimeout(() => {
      ref !== null && ref.updateIndicator();
    }, 1);
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.root}>
          <AppBar
            position="sticky"
            color="default"
            className={classes.stickyAppBar}
          >
            <Tabs
              action={this.handleTabsMounted}
              onChange={this.handleChangeTabs}
              value={this.state.activeTab}
              variant="fullWidth"
            >
              <Tab label="Sök" />
              <Tab label="Exportera" />
            </Tabs>
          </AppBar>
          <div
            className={classes.tabContent}
            style={this.state.activeTab === 0 ? {} : { display: "none" }}
          >
            <FirSearchView
              model={this.props.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
            <FirSearchNeighborView
              model={this.props.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
            <FirSearchResultsView
              model={this.props.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
          </div>
          <div
            className={classes.tabContent}
            style={this.state.activeTab === 1 ? {} : { display: "none" }}
          >
            <FirExportView
              model={this.props.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
          </div>
        </div>
      </>
    );
  }
}

const styles = (theme) => ({
  root: {
    margin: -10,
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  stickyAppBar: {
    top: -10,
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    // justifyContent: "space-between",
    padding: theme.spacing(1),
    width: "100%",
    height: "100%",
  },
  hidden: { display: "none" },
});

export default withStyles(styles)(withSnackbar(FirView));
