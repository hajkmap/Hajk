// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";

// Plugin-specific imports. Most plugins will need a Model, View and Observer
// but make sure to only create and import whatever you need.
import SearchModel from "./SearchModel";
import Journeys from "./SearchViews/Journeys";
import Stops from "./SearchViews/Stops";
import Observer from "react-event-observer";
import { Tooltip } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import clsx from "clsx";
import MenuIcon from "@material-ui/icons/Menu";
import { withStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import SearchResultListContainer from "./SearchResultList/SearchResultListContainer";
import ReactDOM from "react-dom";
import MapViewModel from "./MapViewModel";

const styles = theme => {
  return {
    root: {
      padding: "2px 4px",
      display: "flex",
      alignItems: "center",

      [theme.breakpoints.up("sm")]: {
        maxWidth: 520
      }
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1
    },
    searchContainer: {
      maxWidth: 250
    },
    expand: {
      transform: "rotate(0deg)",
      transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.shortest
      })
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120
    },
    selectEmpty: {
      marginTop: theme.spacing(2)
    },
    expandOpen: {
      transform: "rotate(180deg)"
    },
    searchContainerTitle: {
      marginLeft: 10
    },
    selectInput: {
      padding: 10
    },
    searchModuleContainer: {
      minHeight: 200
    },
    searchModuleContainerRoot: {
      padding: 10
    }
  };
};
const searchTypes = {
  JOURNEYS: "Journeys",
  STOPS: "Stops"
};

const windowsContainerId = "windows-container";

/**
 * @summary Main class for the Dummy plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 * The plugins can also serve as a scaffold for other plugins: simply
 * copy the directory, rename it and all files within, and change logic
 * to create the plugin you want to.
 *
 * @class VTSearch
 * @extends {React.PureComponent}
 */

class VTSearch extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    expanded: false,
    activeSearchTool: null
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  // If unsure of what propTypes are or how to use them, see https://reactjs.org/docs/typechecking-with-proptypes.html.
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    // Unsure why we write "super(props)"?
    // See https://overreacted.io/why-do-we-write-super-props/ for explanation.
    super(props);
    this.type = "VTSearch"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here

    // We can setup a local observer to allow sending messages between here (controller) and model/view.
    // It's called 'localObserver' to distinguish it from AppModel's globalObserver.
    // API docs, see: https://www.npmjs.com/package/react-event-observer
    this.localObserver = Observer();

    // Once created, the observer can subscribe to events with a distinct name. In this example
    // we subscribe to "dummyEvent" When "dummyEvent" is published (from somewhere else)
    // the callback below will be run, with "message" as an optional param.
    // this.localObserver.subscribe("dummyEvent", message => {
    //   console.log(message);
    // });

    // Initiate a model. Although optional, it will probably be used for all except the most simple plugins.
    // In this example, we make our localObserver available for the model as well. This makes it possible
    // to send events between model and main plugin controller.
    this.searchModel = new SearchModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
      geoserver: props.options.geoserver
    });

    this.mapViewModel = new MapViewModel({
      app: props.app,
      map: props.map,
      localObserver: this.localObserver
    });

    // Subscribes for an event when the vt-search has begun.
    this.localObserver.subscribe("vtsearch-result-begin", label => {
      console.log("vtsearch-result-begin, " + label.label);
    });

    this.localObserver.subscribe("vtsearch-result-done", ans => {
      console.log("vtsearch-result-done");
      console.log(ans);
    });
  }

  /**
   * Render is now super-simplified compared to previous versions of Hajk3.
   *
   * All common functionality that has to do with showing a Window, and rendering
   * Drawer or Widget buttons, as well as keeping the state of Window, are now
   * abstracted away to BaseWindowPlugin Component.
   *
   * It's important to pass on all the props from here to our "parent" component.
   *
   * Also, we add a new prop, "custom", which holds props that are specific to this
   * given implementation, such as the icon to be shown, or this plugin's title.
   */
  handleExpandClick = () => {
    this.setState({
      expanded: !this.state.expanded
    });
  };

  handleChange = e => {
    const { app } = this.props;
    app.globalObserver.publish("showSearchresultlist", {});
    this.setState({
      activeSearchTool: e.target.value
    });
  };

  renderSearchmodule = () => {
    const { app } = this.props;
    switch (searchTypes[this.state.activeSearchTool]) {
      case searchTypes.JOURNEYS: {
        return (
          <Journeys
            model={this.searchModel}
            app={app}
            localObserver={this.localObserver}
          ></Journeys>
        );
      }
      case searchTypes.STOPS: {
        return (
          <Stops
            model={this.searchModel}
            app={app}
            localObserver={this.localObserver}
          ></Stops>
        );
      }
      default: {
      }
    }
  };

  render() {
    const { classes, onMenuClick, menuButtonDisabled, app } = this.props;
    const tooltipText = menuButtonDisabled
      ? "Du måste först låsa upp verktygspanelen för kunna klicka på den här knappen. Tryck på hänglåset till vänster."
      : "Visa verktygspanelen";

    //OBS We need to keep the tooltip and IconButton to render menu!! //Tobias
    return (
      <>
        <Card className={classes.searchContainer}>
          <CardActions disableSpacing>
            <Tooltip title={tooltipText}>
              <IconButton
                onClick={onMenuClick}
                disabled={menuButtonDisabled}
                aria-label="menu"
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>

            <FormControl variant="outlined" className={classes.formControl}>
              <Select
                classes={{ root: classes.selectInput }}
                native
                value={this.state.activeSearchType}
                onChange={this.handleChange}
                inputProps={{
                  name: "searchType",
                  id: "search-type"
                }}
              >
                {[
                  <option key="default" value="">
                    Sök
                  </option>
                ].concat(
                  Object.keys(searchTypes).map(key => {
                    return (
                      <option key={key} value={key}>
                        {searchTypes[key]}
                      </option>
                    );
                  })
                )}
              </Select>
            </FormControl>
            <IconButton
              className={clsx(classes.expand, {
                [classes.expandOpen]: this.state.expanded
              })}
              onClick={this.handleExpandClick}
              aria-expanded={this.state.expanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </IconButton>
          </CardActions>
          <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
            <CardContent
              className={classes.searchModuleContainer}
              classes={{ root: classes.searchModuleContainerRoot }}
            >
              {this.renderSearchmodule()}
            </CardContent>
          </Collapse>
        </Card>
        {ReactDOM.createPortal(
          <SearchResultListContainer
            windowsContainer={windowsContainerId}
            localObserver={this.localObserver}
            model={this.searchModel}
            app={app}
          ></SearchResultListContainer>,
          document.getElementById(windowsContainerId)
        )}
      </>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(VTSearch);
