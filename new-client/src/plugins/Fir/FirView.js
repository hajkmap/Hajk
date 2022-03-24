import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import FirSearchView from "./FirSearchView";
import FirExportView from "./FirExportView";
import FirSearchNeighborView from "./FirSearchNeighborView";
import FirSearchResultsView from "./FirSearchResultsView";
import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

const DivRoot = styled("div")(({ theme }) => ({
  margin: -10,
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const StickyAppBar = styled(AppBar)(({ theme }) => ({
  top: -10,
}));

const TabPanel = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1),
  width: "100%",
  height: "100%",
}));

class FirView extends React.PureComponent {
  state = {
    activeTab: 0,
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
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
    const { windowVisible } = this.props;

    return (
      <>
        <DivRoot>
          <StickyAppBar position="sticky" color="default">
            <Tabs
              action={this.handleTabsMounted}
              onChange={this.handleChangeTabs}
              // make sure the window is visible, otherwise an error will be thrown.
              value={windowVisible ? this.state.activeTab : false}
              variant="fullWidth"
            >
              <Tab label="Sök" />
              <Tab label="Exportera" />
            </Tabs>
          </StickyAppBar>
          <TabPanel
            style={
              this.state.activeTab !== 0
                ? {
                    visibility: "hidden",
                    height: 0,
                    overflow: "hidden",
                    padding: 0,
                  }
                : {}
            }
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
          </TabPanel>
          <TabPanel
            style={
              this.state.activeTab !== 1
                ? {
                    visibility: "hidden",
                    height: 0,
                    overflow: "hidden",
                    padding: 0,
                  }
                : {}
            }
          >
            <FirExportView
              model={this.props.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />
          </TabPanel>
        </DivRoot>
      </>
    );
  }
}

export default withSnackbar(FirView);
