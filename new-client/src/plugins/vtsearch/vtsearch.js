// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";

// Plugin-specific imports. Most plugins will need a Model, View and Observer
// but make sure to only create and import whatever you need.
import SearchModel from "./SearchModel";
import Journeys from "./SearchViews/Journeys";
import Stops from "./SearchViews/Stops";
import Lines from "./SearchViews/Lines";
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
import LinearProgress from "@material-ui/core/LinearProgress";
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
        maxWidth: 620
      }
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1
    },
    searchContainer: {
      maxWidth: 260,
      boxShadow: theme.shadows[10]
    },
    searchContainerBox: {
      display: "flex",
      padding: 0, // override current padding
      flexWrap: "wrap",
      minHeight: 60
    },
    expand: {
      transform: "rotate(0deg)",
      transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.shortest
      })
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 150
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
    iconButton: { padding: 7 },

    selectInput: {
      padding: 10
    },
    searchModuleContainer: {
      minHeight: 200
    },
    searchModuleContainerRoot: {
      padding: 10
    },
    loaderContainer: {
      flexBasis: "100%",
      minHeight: "5px"
    }
  };
};

const searchTypes = {
  DEFAULT: "Sök",
  JOURNEYS: "Sök Turer",
  LINES: "Sök Linjer",
  STOPS: "Sök Hållplatser"
};

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
    activeSearchTool: searchTypes.DEFAULT,
    loading: false
  };

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    super(props);
    this.type = "VTSearch"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.localObserver = Observer();

    this.searchModel = new SearchModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
      geoServer: props.options.geoServer
    });

    this.mapViewModel = new MapViewModel({
      app: props.app,
      map: props.map,
      localObserver: this.localObserver,
      model: this.searchModel
    });
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    // Subscribes for an event when the vt-search has begun.
    this.localObserver.subscribe("vtsearch-result-begin", label => {
      this.setState({ loading: true });
    });

    this.localObserver.subscribe("vtsearch-result-done", ans => {
      this.setState({ loading: false });
    });
  };

  handleExpandClick = () => {
    this.setState({
      expanded: !this.state.expanded
    });
  };

  handleChange = e => {
    var typeOfSearch = searchTypes[e.target.value];
    this.setState({
      activeSearchTool: typeOfSearch,
      expanded: typeOfSearch === searchTypes.DEFAULT ? false : true
    });
  };

  renderSearchmodule = () => {
    const { app } = this.props;
    switch (this.state.activeSearchTool) {
      case searchTypes.JOURNEYS: {
        return (
          <Journeys
            model={this.searchModel}
            app={app}
            localObserver={this.localObserver}
          ></Journeys>
        );
      }
      case searchTypes.LINES: {
        return (
          <Lines
            model={this.searchModel}
            app={app}
            localObserver={this.localObserver}
          ></Lines>
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

  renderDropDown() {
    const { classes } = this.props;
    return (
      <FormControl variant="outlined" className={classes.formControl}>
        <Select
          classes={{ root: classes.selectInput }}
          native
          onChange={this.handleChange}
          inputProps={{
            name: "searchType",
            id: "search-type"
          }}
        >
          {Object.keys(searchTypes).map(key => {
            return (
              <option key={key} value={key}>
                {searchTypes[key]}
              </option>
            );
          })}
        </Select>
      </FormControl>
    );
  }

  renderExpansionButton() {
    const { classes } = this.props;
    return (
      <IconButton
        className={
          (clsx(classes.expand, {
            [classes.expandOpen]: this.state.expanded
          }),
          classes.dropDownIconButton)
        }
        onClick={this.handleExpandClick}
        aria-expanded={this.state.expanded}
        aria-label="show more"
      >
        <ExpandMoreIcon />
      </IconButton>
    );
  }

  renderMenuButton() {
    const { onMenuClick, classes, menuButtonDisabled } = this.props;
    const tooltipText = menuButtonDisabled
      ? "Du måste först låsa upp verktygspanelen för kunna klicka på den här knappen. Tryck på hänglåset till vänster."
      : "Visa verktygspanelen";
    return (
      <Tooltip title={tooltipText}>
        <IconButton
          className={classes.iconButton}
          onClick={onMenuClick}
          disabled={menuButtonDisabled}
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>
    );
  }

  renderLoader() {
    return this.state.loading ? <LinearProgress /> : null;
  }

  render() {
    const { classes, app, options } = this.props;

    //OBS We need to keep the tooltip and IconButton to render menu!! //Tobias
    return (
      <>
        <Card className={classes.searchContainer}>
          <CardActions disableSpacing className={classes.searchContainerBox}>
            {this.renderMenuButton()}
            {this.renderDropDown()}
            {this.state.activeSearchTool !== searchTypes.DEFAULT &&
              this.renderExpansionButton()}
            <div className={classes.loaderContainer}>{this.renderLoader()}</div>
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
            localObserver={this.localObserver}
            model={this.searchModel}
            toolConfig={options}
            app={app}
          ></SearchResultListContainer>,
          document.getElementById("windows-container")
        )}
      </>
    );
  }
}

export default withStyles(styles)(VTSearch);
