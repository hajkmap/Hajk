import React from "react";
import { Button, Menu, MenuItem, Paper, Tooltip } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import SwitchCameraIcon from "@material-ui/icons/SwitchCamera";

const styles = theme => ({
  paper: {
    marginBottom: theme.spacing(1)
  },
  button: {
    minWidth: "unset"
  }
});

const fetchConfig = {
  credentials: "same-origin"
};

class MapSwitcher extends React.PureComponent {
  // Will hold map configs
  maps = [];

  state = {
    anchorEl: null,
    selectedIndex: null
  };

  constructor(props) {
    super(props);
    this.appModel = this.props.appModel;
    this.map = this.props.appModel.getMap();
  }

  componentDidMount() {
    let { proxy, mapserviceBase } = this.appModel.config.appConfig;
    let { activeMap } = this.appModel.config;

    fetch(`${proxy}${mapserviceBase}/config/userspecificmaps`, fetchConfig)
      .then(resp => resp.json())
      .then(maps => {
        // Save fetched map configs to global variable
        this.maps = maps;

        // Set selectedIndex to currently selected map
        let selectedIndex = this.maps.findIndex(map => {
          return map.mapConfigurationName === activeMap;
        });
        this.setState({ selectedIndex });
      })
      .catch(err => {
        throw new Error(err);
      });
  }

  renderMenuItems = () => {
    let menuItems = [];
    this.maps.forEach((item, index) => {
      menuItems.push(
        <MenuItem
          key={index}
          // disabled={index === this.state.selectedIndex}
          selected={index === this.state.selectedIndex}
          onClick={event => this.handleMenuItemClick(event, index)}
        >
          {item.mapConfigurationTitle}
        </MenuItem>
      );
    });
    return menuItems;
  };

  // Show dropdown menu, anchored to the element clicked
  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleMenuItemClick = (event, index) => {
    const selectedMap = this.maps[index].mapConfigurationName;
    const x = this.map.getView().getCenter()[0];
    const y = this.map.getView().getCenter()[1];
    const z = this.map.getView().getZoom();
    // TODO: A better solution then redirecting is needed. It requires more
    // work in the App component, so that changing the value of this.appModel.config.activeMap
    // would dynamically reload configuration as needed.
    // But for now, simple redirection will do.
    window.location.assign(
      `${window.location.origin}${window.location.pathname}?m=${selectedMap}&x=${x}&y=${y}&z=${z}`
    );

    // Not used as we change window.location. But in a better solution, we wouldn't reload the app,
    // and then code below would be needed to hide the dropdown menu.
    // this.setState({ anchorEl: null, selectedIndex: index });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { anchorEl } = this.state;
    const { classes } = this.props;
    const open = Boolean(anchorEl);

    const title =
      this.props.appModel.config.mapConfig.map.title || "Karta utan titel";

    return (
      // Render only if config says so
      this.props.appModel.config.mapConfig.map.mapselector && (
        <>
          <Tooltip title={`Nuvarande karta: ${title}`}>
            <Paper className={classes.paper}>
              <Button
                aria-owns={open ? "render-props-menu" : undefined}
                aria-haspopup="true"
                className={classes.button}
                onClick={this.handleClick}
              >
                <SwitchCameraIcon />
              </Button>
            </Paper>
          </Tooltip>
          <Menu
            id="render-props-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={this.handleClose}
          >
            {this.renderMenuItems()}
          </Menu>
        </>
      )
    );
  }
}

export default withStyles(styles)(MapSwitcher);
