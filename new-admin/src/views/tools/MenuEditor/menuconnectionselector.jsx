import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import { blue, green, red } from "@material-ui/core/colors";
import { Typography } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import DescriptionIcon from "@material-ui/icons/Description";
import RoomIcon from "@material-ui/icons/Room";
import LanguageIcon from "@material-ui/icons/Language";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import FormControl from "@material-ui/core/FormControl";
import Popover from "@material-ui/core/Popover";
import TextField from "@material-ui/core/TextField";
import SettingsIcon from "@material-ui/icons/Settings";
import WarningIcon from "@material-ui/icons/Warning";

import ListItemIcon from "@material-ui/core/ListItemIcon";
import { withStyles } from "@material-ui/core/styles";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { ColorButtonGreen } from "./custombuttons.jsx";

const getPopoverMenuItemTitle = label => {
  return <Typography variant="h6">{label}: </Typography>;
};

const getTextField = (value, onChangeFunction, variant) => {
  return (
    <TextField
      id="icon-picker"
      label={""}
      type="icon"
      variant={variant}
      value={value}
      onChange={onChangeFunction}
    />
  );
};

const MENU_CONNECTION_TYPES = {
  documentConnection: "Koppla dokument",
  mapLink: "Koppla karta och lager",
  link: "Koppla webblänk",
  subMenu: "Inget valt"
};

const styles = theme => ({
  popoverActionArea: { paddingTop: "10px" },
  menuItem: {
    "&:focus": {
      backgroundColor: theme.palette.primary.light
    }
  }
});

class MenuConnectionSelector extends React.Component {
  state = {
    open: false,
    mapLinkValue: this.props.menuItem.maplink,
    linkValue: this.props.menuItem.link,
    documentValue: this.props.menuItem.document,
    activeMenu: ""
  };

  componentDidMount = () => {
    this.setState({
      value: this.getInitialValue()
    });
  };

  getInitialValue = () => {
    const { menuItem } = this.props;

    if (menuItem.menu.length > 0) {
      return MENU_CONNECTION_TYPES.subMenu;
    }

    if (menuItem.document !== "") {
      return MENU_CONNECTION_TYPES.documentConnection;
    }

    if (menuItem.link) {
      return MENU_CONNECTION_TYPES.link;
    }

    if (menuItem.maplink) {
      return MENU_CONNECTION_TYPES.mapLink;
    }
  };

  openConnectionsMenu = e => {
    this.setState({
      connectionsMenuAnchorEl: e.currentTarget
    });
  };

  closeConnectionsMenu = () => {
    this.setState({ connectionsMenuAnchorEl: null, open: false });
  };

  renderConnectionMenuSelectOption = (value, index) => {
    return (
      <MenuItem key={index} value={value}>
        <ListItemIcon>
          <SettingsIcon></SettingsIcon>
        </ListItemIcon>
        <Typography>{value}</Typography>
        {value !== MENU_CONNECTION_TYPES.subMenu && (
          <ArrowRightIcon></ArrowRightIcon>
        )}
      </MenuItem>
    );
  };

  renderMenuConnectionSettings = () => {
    const { connectionsMenuAnchorEl } = this.state;
    const { classes } = this.props;
    return (
      <Popover
        PaperProps={{
          style: { width: "500px", height: "500px", padding: "20px" }
        }}
        open={Boolean(connectionsMenuAnchorEl)}
        onClose={this.closeConnectionsMenu}
        anchorEl={connectionsMenuAnchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left"
        }}
      >
        <Grid container>
          <Grid xs={12} item>
            {this.renderPopoverContent()}
          </Grid>
          <Grid className={classes.popoverActionArea} xs={12} item>
            <ColorButtonGreen
              variant="contained"
              className="btn"
              onClick={this.update}
            >
              OK
            </ColorButtonGreen>
          </Grid>
        </Grid>
      </Popover>
    );
  };

  update = e => {
    const { treeNodeId, updateMenuItem } = this.props;
    const { activeMenu } = this.state;
    e.preventDefault();
    let newMenuItem = {
      maplink: "",
      link: "",
      document: ""
    };
    if (activeMenu === MENU_CONNECTION_TYPES.documentConnection) {
      newMenuItem = { ...newMenuItem, document: this.state.documentValue };
    }

    if (activeMenu === MENU_CONNECTION_TYPES.link) {
      newMenuItem = { ...newMenuItem, link: this.state.linkValue };
    }

    if (activeMenu === MENU_CONNECTION_TYPES.mapLink) {
      newMenuItem = { ...newMenuItem, maplink: this.state.mapLinkValue };
    }

    updateMenuItem(treeNodeId, newMenuItem);

    this.setState({
      connectionsMenuAnchorEl: null,
      open: false,
      value: this.state.activeMenu
    });
  };

  renderDocumentList = () => {
    const { availableDocuments, classes } = this.props;
    const { documentValue } = this.state;
    return (
      <Grid item>
        <List component="nav">
          {availableDocuments.map((availableDocument, index) => {
            return (
              <ListItem
                autoFocus={availableDocument === documentValue ? true : false}
                className={classes.menuItem}
                key={index}
                onClick={e => {
                  this.setState({ documentValue: availableDocuments[index] });
                }}
                button
              >
                <ListItemText primary={availableDocument}></ListItemText>
              </ListItem>
            );
          })}
        </List>
      </Grid>
    );
  };

  getLink = (label, value, onChangeFunction) => {
    return (
      <Grid xs={12} item>
        {getPopoverMenuItemTitle(label)}
        {getTextField(value, onChangeFunction, "standard")}
      </Grid>
    );
  };

  renderMapLink = () => {
    return this.getLink("Kartlänk", this.state.mapLinkValue, e => {
      this.setState({ mapLinkValue: e.target.value });
    });
  };

  renderLink = () => {
    return this.getLink("Webblänk", this.state.linkValue, e => {
      this.setState({ linkValue: e.target.value });
    });
  };

  renderPopoverContent = () => {
    const { activeMenu } = this.state;
    if (activeMenu === MENU_CONNECTION_TYPES.subMenu) {
      return null;
    }
    if (activeMenu === MENU_CONNECTION_TYPES.documentConnection) {
      return this.renderDocumentList();
    }

    if (activeMenu === MENU_CONNECTION_TYPES.link) {
      return this.renderLink();
    }

    if (activeMenu === MENU_CONNECTION_TYPES.mapLink) {
      return this.renderMapLink();
    }
  };

  handleChange = e => {
    if (e.target.value !== MENU_CONNECTION_TYPES.subMenu) {
      this.setState({
        activeMenu: e.target.value,
        connectionsMenuAnchorEl: e.currentTarget,
        open: true
      });
    } else {
      this.setState({
        value: e.target.value
      });
    }
  };

  getRenderedSelectionText = (label, icon) => {
    return (
      <Grid container>
        {icon && <Grid item>{icon}</Grid>}
        <Grid item>
          <Typography>{label}</Typography>
        </Grid>
      </Grid>
    );
  };

  getRenderValue = () => {
    const { menuItem } = this.props;
    if (this.state.value === MENU_CONNECTION_TYPES.documentConnection) {
      return this.getRenderedSelectionText(
        menuItem.document,
        <DescriptionIcon></DescriptionIcon>
      );
    }

    if (this.state.value === MENU_CONNECTION_TYPES.subMenu) {
      return this.getRenderedSelectionText("Undermeny");
    }

    if (this.state.value === MENU_CONNECTION_TYPES.link) {
      return this.getRenderedSelectionText("Webblänk", <RoomIcon></RoomIcon>);
    }

    if (this.state.value === MENU_CONNECTION_TYPES.mapLink) {
      return this.getRenderedSelectionText(
        "Karta",
        <LanguageIcon></LanguageIcon>
      );
    }

    return this.getRenderedSelectionText("Ingen koppling");
  };

  render = () => {
    const { value, open } = this.state;
    const { valid } = this.props;

    if (value) {
      return (
        <>
          <FormControl>
            <Grid container>
              <Grid item>{!valid && <WarningIcon></WarningIcon>}</Grid>

              <Grid item>
                <Select
                  MenuProps={{
                    disableScrollLock: true,
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left"
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left"
                    },
                    getContentAnchorEl: null
                  }}
                  onOpen={() => {
                    this.setState({ open: true });
                  }}
                  onClose={() => {
                    this.setState({ open: false });
                  }}
                  renderValue={this.getRenderValue}
                  onChange={this.handleChange}
                  open={open}
                  value={value}
                >
                  {Object.values(MENU_CONNECTION_TYPES).map((value, index) => {
                    return this.renderConnectionMenuSelectOption(value, index);
                  })}
                </Select>
                {this.renderMenuConnectionSettings()}
              </Grid>
            </Grid>
          </FormControl>
        </>
      );
    } else {
      return null;
    }
  };
}

export default withStyles(styles)(MenuConnectionSelector);
