import React from "react";
import { IconButton, Menu, MenuItem, Paper, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import SwitchCameraIcon from "@mui/icons-material/SwitchCamera";
import { hfetch } from "utils/FetchWrapper";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  minWidth: "unset",
}));

class MapSwitcher extends React.PureComponent {
  // Will hold map configs
  maps = [];

  state = {
    anchorEl: null,
    selectedIndex: null,
  };

  constructor(props) {
    super(props);
    this.appModel = this.props.appModel;
    this.map = this.props.appModel.getMap();
  }

  handleLoading(maps) {
    let { activeMap } = this.appModel.config;

    maps.sort((a, b) =>
      a.mapConfigurationTitle.localeCompare(b.mapConfigurationTitle)
    );

    // Save fetched map configs to global variable
    this.maps = maps;

    // Set selectedIndex to currently selected map
    let selectedIndex = this.maps.findIndex((map) => {
      return map.mapConfigurationName === activeMap;
    });
    this.setState({ selectedIndex });
  }

  componentDidMount() {
    let { proxy, mapserviceBase } = this.appModel.config.appConfig;

    // If user specific maps is provided by the new API, the key will
    // already exist in config and there's no need to fetch again.
    // However, if it's undefined, it looks like we're using the old API
    // and MapSwitcher must do the fetch by itself.
    if (this.appModel.config.userSpecificMaps !== undefined) {
      this.handleLoading(this.appModel.config.userSpecificMaps);
    } else {
      hfetch(`${proxy}${mapserviceBase}/config/userspecificmaps`)
        .then((resp) => resp.json())
        .then((maps) => this.handleLoading(maps))
        .catch((err) => {
          throw new Error(err);
        });
    }
  }

  renderMenuItems = () => {
    return this.maps.map((item, index) => (
      <MenuItem
        key={index}
        // disabled={index === this.state.selectedIndex}
        selected={index === this.state.selectedIndex}
        onClick={(event) => this.handleMenuItemClick(event, index)}
      >
        {item.mapConfigurationTitle}
      </MenuItem>
    ));
  };

  // Show dropdown menu, anchored to the element clicked
  handleClick = (event) => {
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
    const open = Boolean(anchorEl);

    const title =
      this.props.appModel.config.mapConfig.map.title || "Karta utan titel";

    return (
      // Render only if config says so
      this.props.appModel.config.mapConfig.map.mapselector && (
        <>
          <Tooltip disableInteractive title={`Nuvarande karta: ${title}`}>
            <StyledPaper>
              <StyledIconButton
                aria-label="Byt karta"
                aria-owns={open ? "render-props-menu" : undefined}
                aria-haspopup="true"
                onClick={this.handleClick}
              >
                <SwitchCameraIcon />
              </StyledIconButton>
            </StyledPaper>
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

export default MapSwitcher;
