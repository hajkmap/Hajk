import React from "react";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import SwitchCameraIcon from "@material-ui/icons/SwitchCamera";

const styles = theme => ({
  icon: {
    color: "black",
    padding: "3px",
    overflow: "visible",
    cursor: "pointer"
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
    let selectedMap = this.maps[index].mapConfigurationName;

    // TODO: A better solution then redirecting is needed. It requires more
    // work in the App component, so that changing the value of this.appModel.config.activeMap
    // would dynamically reload configuration as needed.
    // But for now, simple redirection will do.
    window.location.assign(
      `${window.location.origin}${window.location.pathname}?m=${selectedMap}`
    );

    // Not used as we change window.location. But in a better solution, we wouldn't reload the app,
    // and then code below would be needed.
    // this.setState({ anchorEl: null, selectedIndex: index });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { anchorEl } = this.state;
    const { classes } = this.props;

    const open = Boolean(anchorEl);
    return (
      <>
        <Button
          aria-owns={open ? "render-props-menu" : undefined}
          aria-haspopup="true"
          onClick={this.handleClick}
        >
          <SwitchCameraIcon className={classes.icon} />
          Byt karta
        </Button>
        <Menu
          id="render-props-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={this.handleClose}
        >
          {this.renderMenuItems()}
        </Menu>
      </>
    );
  }
}

export default withStyles(styles)(MapSwitcher);
