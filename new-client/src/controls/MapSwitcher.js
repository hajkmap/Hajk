import React from "react";
import { IconButton, Menu, MenuItem, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import SwitchCameraIcon from "@mui/icons-material/SwitchCamera";
import { hfetch } from "../utils/FetchWrapper";
import HajkToolTip from "../components/HajkToolTip";

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
    if (this.appModel.config.mapConfig.map?.enableAppStateInHash === true) {
      // If live changing of hash params is enabled, grab the old hash
      const oldHash = new URLSearchParams(
        window.location.hash.replaceAll("#", "")
      );

      // Set the m param to the new map's name
      oldHash.set("m", selectedMap);

      // We must remove layer and group layer keys as it's really
      // dangerous to keep them. If a layer, specified in l, wouldn't
      // be available in the new map we're changing to, we would end up
      // with no layers at all. (The reason for that is that _if_ the l param
      // is present, the visibleAtStart value for layers from map config are
      // ignored. We don't want to do that when changing map, so be sure and
      // remove them.)
      // TODO: Consider removing more keys, if issues come up. Candidates include
      // "q", "s" and "p".
      oldHash.delete("l");
      oldHash.delete("gl");

      // Set the modified hash to our location bar
      window.location.hash = "#" + oldHash.toString();

      // Force the browser to reload
      window.location.reload();

      // Not needed, but if we will ever go towards hot reload,
      // don't forget to hide the dropdown menu
      // this.setState({ anchorEl: null, selectedIndex: index });
    } else {
      // If live hash params are disabled, fall back to the old and tried
      // method of setting query params. This will also reload the page
      // so no need to take care of component state here. But we want to ensure
      // that user ends up in the same place, so we grab the x, y and z too.
      const x = this.map.getView().getCenter()[0];
      const y = this.map.getView().getCenter()[1];
      const z = this.map.getView().getZoom();

      window.location.assign(
        `${window.location.origin}${window.location.pathname}?m=${selectedMap}&x=${x}&y=${y}&z=${z}`
      );
    }
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
          <HajkToolTip title={`Nuvarande karta: ${title}`}>
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
          </HajkToolTip>
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
