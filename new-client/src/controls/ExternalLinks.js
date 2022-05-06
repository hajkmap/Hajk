import React from "react";
import { styled } from "@mui/material/styles";
import propTypes from "prop-types";
import { IconButton, Paper, Tooltip, Menu, MenuItem } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { transform } from "ol/proj";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  minWidth: "unset",
}));

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

  convertCoordinates = (
    x,
    y,
    projection,
    targetProjection,
    numberOfDecimals = 4
  ) => {
    const newCoords = transform([x, y], projection, targetProjection);
    return {
      x: parseFloat(newCoords[0].toFixed(numberOfDecimals)),
      y: parseFloat(newCoords[1].toFixed(numberOfDecimals)),
    };
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

    let url = uri;
    dataList.forEach((o) => {
      // Convert coordinate to the projection specified in uri..
      const newCoord = this.convertCoordinates(
        coordinates[0],
        coordinates[1],
        projection,
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
      (this.config.hasOwnProperty("options") &&
        this.config.options.list.length === 0)
    ) {
      return null;
    } else {
      const { anchorEl } = this.state;
      const open = Boolean(anchorEl);
      return (
        <>
          <Tooltip disableInteractive title={this.title}>
            <StyledPaper>
              <StyledIconButton
                aria-label={this.title}
                onClick={this.handleClick}
              >
                <LaunchIcon />
              </StyledIconButton>
            </StyledPaper>
          </Tooltip>
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
