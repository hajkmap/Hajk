import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Observer from "react-event-observer";
import AppModel from "./../models/AppModel.js";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import { Toolbar as MUIToolbar, CssBaseline } from "@material-ui/core";
import { SnackbarProvider, withSnackbar } from "notistack";
import Toolbar from "./Toolbar.js";
//import Popup from "./Popup.js";
import Window from "./Window.js";
import Alert from "./Alert";
import Loader from "./Loader";
import Reparentable from "./Reparentable";
import ToolbarMenu from "./ToolbarMenu";
import { isMobile } from "../utils/IsMobile.js";
import Zoom from "../controls/Zoom";

document.windows = [];

// Global customizations that previously went to custom.css
// should now go to public/customTheme.json. They are later
// merged when MUI Theme is created in index.js.
const styles = theme => {
  return {
    // We can also consult https://material-ui.com/customization/default-theme/ for available options
    map: {
      flexGrow: 1,
      overflow: "hidden",
      position: "absolute",
      top: "64px",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1
    },
    extendedIcon: {
      marginRight: theme.spacing.unit
    },
    toolbarRoot: {
      paddingLeft: "5px",
      paddingRight: "5px",
      height: "64px",
      justifyContent: "space-between",
      [theme.breakpoints.down("xs")]: {
        justifyContent: "space-between"
      }
    },
    toolbar: {
      top: 0,
      color: "black",
      zIndex: 2,
      order: 0
    },
    toolbarContent: {
      display: "flex",
      alignItems: "center"
    },
    appBar: {
      zIndex: 2,
      background: "white",
      color: "black"
    },
    logo: {
      height: "40px",
      marginLeft: "10px",
      marginRight: "10px",
      "& img": {
        height: "100%"
      },
      [theme.breakpoints.down("xs")]: {
        marginLeft: "0",
        marginRight: "0"
      }
    },
    title: {
      marginLeft: "8px"
    },
    flex: {
      flexGrow: 1
    },
    columnToolbar: {
      zIndex: 1,
      background: "white",
      boxShadow: "2px 2px 2px rgba(0, 0, 0, 0.18)",
      [theme.breakpoints.down("xs")]: {
        zIndex: 1000
      }
    },
    column1: {
      zIndex: 1,
      flex: 0,
      [theme.breakpoints.down("xs")]: {
        zIndex: 1000
      }
    },
    column2: {
      zIndex: 2,
      flex: 1,
      justifyContent: "center",
      display: "flex",
      margin: "0 10px",
      flexDirection: "column",
      [theme.breakpoints.down("xs")]: {
        zIndex: 1000
      }
    },
    centerContainer: {
      flex: 0,
      display: "flex",
      justifyContent: "center",
      zIndex: 1000
    },
    toolbarPanel: {
      flex: 1
    },
    column3: {
      zIndex: 1,
      [theme.breakpoints.down("xs")]: {
        zIndex: 1000
      }
    },
    columnControls: {
      zIndex: 1,
      pointerEvents: "none",
      [theme.breakpoints.down("xs")]: {
        zIndex: 1,
        position: "absolute",
        right: 0
      }
    },
    columnWidgets: {
      display: "flex",
      flexDirection: "row",
      height: "100%"
    },
    columnCenter: {
      width: "100%",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      pointerEvents: "none",
      padding: "10px",
      [theme.breakpoints.down("md")]: {
        zIndex: 1001
      },
      [theme.breakpoints.down("xs")]: {
        padding: 0,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        bottom: 0,
        position: "absolute"
      }
    },
    columnArticle: {
      pointerEvents: "none",
      flex: 1,
      zIndex: 1,
      marginBottom: "50px",
      [theme.breakpoints.down("xs")]: {},
      position: "absolute"
    },
    controls: {
      zIndex: 1,
      padding: "5px 5px 5px 0"
    },
    overlay: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      top: "0",
      right: 0,
      left: 0,
      bottom: 0,
      position: "absolute"
    },
    button: {
      width: "50px",
      height: "50px",
      marginBottom: "10px",
      outline: "none"
    },
    visible: {
      display: "block"
    },
    searchIcon: {
      marginRight: theme.spacing.unit,
      display: "block",
      [theme.breakpoints.up("lg")]: {
        display: "none"
      }
    },
    footer: {
      position: "absolute",
      top: 0,
      bottom: isMobile ? -(window.innerHeight - 45) + "px" : 0
    },
    widgetItem: {
      width: "220px",
      pointerEvents: "all",
      [theme.breakpoints.down("md")]: {
        width: "100%"
      }
    },
    windowContainer: {
      position: "absolute",
      top: "64px",
      left: "50px",
      right: 0,
      bottom: 0,
      background: "rgba(255, 255, 255, 0.5)",
      zIndex: 5000
    }
  };
};

class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      alert: false,
      loading: false,
      mapClickDataResult: {},
      mobile: window.innerWidth < 600
    };
    this.globalObserver = new Observer();
    this.appModel = new AppModel(props.config, this.globalObserver);
    this.widgetsLeftContainer = document.createElement("div");
    this.widgetsRightContainer = document.createElement("div");
  }

  componentDidMount() {
    var promises = this.appModel
      .createMap()
      .addLayers()
      .loadPlugins(this.props.activeTools);
    Promise.all(promises).then(() => {
      this.setState({
        tools: this.appModel.getPlugins()
      });
      this.globalObserver.publish("appLoaded");
    });
    this.bindHandlers();
  }

  componentDidCatch(error) {
    console.error(error);
  }

  bindHandlers() {
    this.globalObserver.subscribe("mapClick", mapClickDataResult => {
      this.appModel.highlight(false);
      this.setState({
        mapClickDataResult: mapClickDataResult
      });
    });

    this.globalObserver.subscribe("alert", message => {
      this.setState({
        alert: true,
        alertMessage: message
      });
    });

    window.addEventListener("resize", () => {
      this.setState({
        mobile: window.innerWidth < 600
      });
    });

    this.appModel
      .getMap()
      .getLayers()
      .getArray()
      .forEach(layer => {
        layer.on("change:visible", evt => {
          let layer = evt.target;
          if (
            this.state.mapClickDataResult &&
            Array.isArray(this.state.mapClickDataResult.features)
          ) {
            this.state.mapClickDataResult.features.forEach(feature => {
              if (feature.layer === layer) {
                let o = { ...this.state.mapClickDataResult };
                o.features = o.features.filter(f => f !== feature);
                this.setState({
                  mapClickDataResult: o
                });
              }
            });
          }
        });
      });
  }

  renderWidgets(target) {
    const { classes } = this.props;
    const { tools } = this.state;
    if (tools) {
      return tools
        .filter(tool => tool.options.target === target)
        .sort((a, b) =>
          a.sortOrder === b.sortOrder ? 0 : a.sortOrder > b.sortOrder ? 1 : -1
        )
        .map((tool, i) => {
          if (tool.type === "layerswitcher" && !tool.options.active) {
            return null;
          }
          return (
            <div
              key={i}
              className={classes.widgetItem}
              onClick={e => {
                this.globalObserver.publish("widgetItemClicked");
              }}
            >
              <tool.component
                map={tool.map}
                app={tool.app}
                options={tool.options}
                type="widgetItem"
              />
            </div>
          );
        });
    } else {
      return null;
    }
  }

  renderPopup() {
    // TODO: Ensure that Popup mode for infoclick works.
    // I'm temporarily disabling that option and send all infoclicks to display as Window.

    // var config = this.props.config.mapConfig.tools.find(
    //   tool => tool.type === "infoclick"
    // );
    // if (config && config.options.displayPopup) {
    //   return (
    //     <Popup
    //       mapClickDataResult={this.state.mapClickDataResult}
    //       map={this.appModel.getMap()}
    //       onClose={() => {
    //         this.setState({
    //           mapClickDataResult: undefined
    //         });
    //       }}
    //     />
    //   );
    // } else {
    var open =
      this.state.mapClickDataResult &&
      this.state.mapClickDataResult.features &&
      this.state.mapClickDataResult.features.length > 0;
    var features =
      this.state.mapClickDataResult && this.state.mapClickDataResult.features;

    return (
      <Window
        globalObserver={this.globalObserver}
        title="Sökresultat"
        open={open}
        position="right"
        mode="window"
        width={400}
        top={0}
        features={features}
        map={this.appModel.getMap()}
        onDisplay={feature => {
          this.appModel.highlight(feature);
        }}
        onClose={() => {
          this.appModel.highlight(false);
          this.setState({
            mapClickDataResult: undefined
          });
        }}
      />
    );
  }

  render() {
    const { classes, config } = this.props;
    return (
      <SnackbarProvider
        maxSnack={3}
        classes
        anchorOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
      >
        <>
          <CssBaseline />
          <Alert
            open={this.state.alert}
            message={this.state.alertMessage}
            parent={this}
            title="Meddelande"
          />
          <Loader visible={this.state.loading} />
          {ReactDOM.createPortal(
            this.renderWidgets("left"),
            this.widgetsLeftContainer
          )}
          {ReactDOM.createPortal(
            this.renderWidgets("right"),
            this.widgetsRightContainer
          )}
          <AppBar position="absolute" className={classes.appBar}>
            <MUIToolbar className={classes.toolbarRoot}>
              <div id="toolbar-left" className={classes.toolbarContent}>
                <div id="tools-toggler" />
                <div className={classes.logo}>
                  <img src={config.mapConfig.map.logo} alt="logo" />
                </div>
                <span className={classes.title}>
                  <Typography variant="h6">
                    {config.mapConfig.map.title}
                  </Typography>
                </span>
              </div>
              <div id="toolbar-right" className={classes.toolbarContent}>
                <ToolbarMenu appModel={this.appModel} />
              </div>
            </MUIToolbar>
          </AppBar>
          <div className={classes.map} id="map">
            <div id="map-overlay" className={classes.overlay}>
              <div className={classes.columnToolbar}>
                <Toolbar
                  tools={this.appModel.getToolbarPlugins()}
                  parent={this}
                  globalObserver={this.globalObserver}
                  widgets={
                    this.state.mobile && (
                      <div>
                        <Reparentable el={this.widgetsLeftContainer} />
                        <Reparentable el={this.widgetsRightContainer} />
                      </div>
                    )
                  }
                />
              </div>
              <div className={classes.columnCenter}>
                <div className={classes.columnWidgets}>
                  <div className={classes.column1}>
                    {!this.state.mobile && (
                      <Reparentable el={this.widgetsLeftContainer} />
                    )}
                  </div>
                  <div className={classes.column2}>
                    <div id="center" className={classes.centerContainer} />
                    <article
                      id="toolbar-panel"
                      className={classes.toolbarPanel}
                    >
                      {this.renderPopup()}
                    </article>
                  </div>
                  <div className={classes.column3}>
                    {!this.state.mobile && (
                      <Reparentable el={this.widgetsRightContainer} />
                    )}
                  </div>
                </div>
              </div>
              <div className={classes.columnControls}>
                <div className={classes.controls}>
                  <Zoom map={this.appModel.getMap()} />
                </div>
              </div>
            </div>
          </div>
          <footer className={classes.footer} id="footer" />
        </>
      </SnackbarProvider>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(App));
