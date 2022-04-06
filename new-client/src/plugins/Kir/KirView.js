import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import KirSearchView from "./KirSearchView";
import KirExportView from "./KirExportView";
import KirSearchResultsView from "./KirSearchResultsView";

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
    padding: theme.spacing(1),
    width: "100%",
    height: "100%",
  },
  hidden: { display: "none" },
});
class KirView extends React.PureComponent {
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
            <KirSearchView
              model={this.props.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
            <KirSearchResultsView
              model={this.props.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
          </div>
          <div
            className={classes.tabContent}
            style={this.state.activeTab === 1 ? {} : { display: "none" }}
          >
            <KirExportView
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

export default withStyles(styles)(withSnackbar(KirView));
