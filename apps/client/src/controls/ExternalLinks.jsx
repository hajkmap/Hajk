import React from "react";
import propTypes from "prop-types";
import { Menu, MenuItem } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import HajkTransformer from "../utils/HajkTransformer";
import ControlButton from "components/ControlButton";

class ExternalLinks extends React.PureComponent {
  static propTypes = {
    appModel: propTypes.object.isRequired,
  };

  state = {
    anchorEl: null,
  };

  constructor(props) {
    super(props);
    this.type = "ExternalLinks"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.config = props.appModel.config.mapConfig.tools.find(
      (t) => t.type === "externalLinks"
    );

    // If config isn't found.... it is time to return.
    if (!this.config) {
      return;
    }

    this.appModel = props.appModel;
    this.globalObserver = props.appModel.globalObserver;

    this.options = this.config.options;
    this.map = props.appModel.getMap();
    this.title = this.options.title || "Öppna koordinat i extern applikation";
  }

  // Show dropdown menu, anchored to the element clicked
  handleClick = (event) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  openUri = (uri, target) => {
    // Try to match {x|EPSG:4326|0} etc in uri.
    const regex = /\{([x,y].+?)\}/gim;
    const zoomKey = "{zoom}";

    let m;
    let dataList = [];

    while ((m = regex.exec(uri)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      const values = m[1].split("|");
      const data = {
        replaceKey: m[0], // for example {x|EPSG:4326|0}
        key: values[0], // x or y
        projection: values[1], // projection to convert to, for example EPSG:4326.
        decimals: values.length > 2 ? parseInt(values[2]) : 4, // 4 decimals is default and should probably always be enough.
      };
      dataList.push(data);
    }

    const coordinates = this.map.getView().getCenter();
    const projection = this.map.getView().getProjection().getCode();
    const transformer = new HajkTransformer({
      projection: projection,
    });

    let url = uri;
    dataList.forEach((o) => {
      // Convert coordinate to the projection specified in uri..
      const newCoord = transformer.getCoordinatesWithProjection(
        coordinates[0],
        coordinates[1],
        o.projection,
        o.decimals
      );
      // Replace the replaceKey with the converted coordinates.
      url = url.replace(o.replaceKey, newCoord[o.key]);
    });

    // Replace {zoom}. good when opening in other Hajk map.
    if (url.indexOf(zoomKey) > -1) {
      url = url.replace(zoomKey, this.map.getView().getZoom());
    }

    console.log("External link will open", url);
    window.open(url, target);
  };

  handleItemClick = (event, item) => {
    const uri = item.uri;
    try {
      this.openUri(uri, "_blank");
    } catch (err) {
      console.warn(
        `ExternalLinks: openUri: Could not open Uri:\n${uri}\n${err}`
      );
    }
  };

  renderMenuItems = () => {
    const menuItems = [];
    this.options.list.forEach((item, index) => {
      menuItems.push(
        <MenuItem
          key={index}
          onClick={(event) => this.handleItemClick(event, item)}
        >
          {item.name}
        </MenuItem>
      );
    });
    return menuItems;
  };

  render() {
    // If config for Control isn't found, or if the config doesn't contain anything, quit.
    if (
      !this.config ||
      (Object.hasOwn(this.config, "options") &&
        this.config.options.list.length === 0)
    ) {
      return null;
    } else {
      const { anchorEl } = this.state;
      const open = Boolean(anchorEl);
      return (
        <>
          <ControlButton
            tooltip={this.title}
            ariaLabel={this.title}
            onClick={this.handleClick}
          >
            <LaunchIcon />
          </ControlButton>
          <Menu
            id="externalLinksMenu"
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
}

export default ExternalLinks;
