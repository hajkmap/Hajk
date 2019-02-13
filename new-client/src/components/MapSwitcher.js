import React from "react";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({});

const fetchConfig = {
  credentials: "same-origin"
};

class MapSwitcher extends React.PureComponent {
  state = {
    maps: [],
    anchorEl: null
  };

  constructor(props) {
    super(props);
    this.appModel = this.props.appModel;
  }

  componentDidMount() {
    // defaultMap from config is NOT the same as currently active map. How do we get that!?
    // let { proxy, mapserviceBase, defaultMap } = this.appModel.config.appConfig;
    let { proxy, mapserviceBase } = this.appModel.config.appConfig;
    fetch(`${proxy}${mapserviceBase}/config/userspecificmaps`, fetchConfig)
      .then(resp => resp.json())
      .then(maps => {
        this.setState({ maps });
      })
      .catch(err => {
        throw new Error(err);
      });
  }

  renderMenuItems = () => {
    let menuItems = [];
    this.state.maps.forEach((item, index) => {
      menuItems.push(
        <MenuItem key={index} onClick={this.handleClick}>
          {item.mapConfigurationTitle}
        </MenuItem>
      );
    });
    return menuItems;
  };

  handleClick = e => {
    console.log("I'd really want to change map config now…", e.currentTarget);
    this.setState({ anchorEl: e.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);
    return (
      <>
        <Button
          aria-owns={open ? "render-props-menu" : undefined}
          aria-haspopup="true"
          onClick={this.handleClick}
        >
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
