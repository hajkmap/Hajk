import React from "react";

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
import WarningIcon from "@material-ui/icons/Warning";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import BlockIcon from "@material-ui/icons/Block";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { ColorButtonGreen, ColorButtonRed } from "./custombuttons.jsx";

const getPopoverMenuItemTitle = (label) => {
  return <Typography variant="h6">{label}: </Typography>;
};

const getTextField = (value, onChangeFunction, variant) => {
  return (
    <TextField
      label={""}
      type="icon"
      fullWidth
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
  none: "Inget valt",
};

const MAPLINK_TEXT = "Kartlänk";
const WEBLINK_TEXT = "Webblänk";
const NONE_TEXT = "Inget valt";
const MAP_TEXT = "Karta";

const styles = (theme) => ({
  menuItem: {
    "&:focus": {
      backgroundColor: theme.palette.primary.light,
    },
  },
  paper: { width: "20%", padding: "20px" },
});

class MenuConnectionSelector extends React.Component {
  state = {
    open: false,
    mapLinkValue: this.props.menuItem.maplink,
    linkValue: this.props.menuItem.link,
    documentValue: this.props.menuItem.document,
    activeMenu: "",
  };

  componentDidMount = () => {
    this.setState({
      value: this.getInitialValue(),
    });
  };

  getInitialValue = () => {
    const { menuItem } = this.props;

    if (menuItem.document !== "") {
      return MENU_CONNECTION_TYPES.documentConnection;
    }

    if (menuItem.link) {
      return MENU_CONNECTION_TYPES.link;
    }

    if (menuItem.maplink) {
      return MENU_CONNECTION_TYPES.mapLink;
    }

    return MENU_CONNECTION_TYPES.none;
  };

  openConnectionsMenu = (e) => {
    this.setState({
      connectionsMenuAnchorEl: e.currentTarget,
    });
  };

  closeConnectionsMenu = () => {
    this.setState({ connectionsMenuAnchorEl: null, open: false });
  };

  getMenuConnectionTypeIcon = (type) => {
    return type === MENU_CONNECTION_TYPES.link ? (
      <LanguageIcon></LanguageIcon>
    ) : type === MENU_CONNECTION_TYPES.mapLink ? (
      <RoomIcon></RoomIcon>
    ) : type === MENU_CONNECTION_TYPES.documentConnection ? (
      <DescriptionIcon></DescriptionIcon>
    ) : type === MENU_CONNECTION_TYPES.none ? (
      <BlockIcon></BlockIcon>
    ) : (
      <BlockIcon></BlockIcon>
    );
  };

  renderConnectionMenuSelectOption = (value, index) => {
    return (
      <MenuItem
        onClick={(e) => {
          this.handleChange(e.currentTarget, value);
        }}
        key={index}
        value={value}
      >
        <ListItemIcon>{this.getMenuConnectionTypeIcon(value)}</ListItemIcon>
        <Typography>{value}</Typography>
        {value !== MENU_CONNECTION_TYPES.none && (
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
        PaperProps={{ className: classes.paper }}
        open={Boolean(connectionsMenuAnchorEl)}
        anchorEl={connectionsMenuAnchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Grid spacing={2} container>
          <Grid xs={12} item>
            {this.renderPopoverContent()}
          </Grid>
          <Grid xs={12} item>
            <ColorButtonGreen
              variant="contained"
              className="btn"
              onClick={this.updateSelection}
            >
              <Typography variant="button">OK</Typography>
            </ColorButtonGreen>
            <ColorButtonRed onClick={this.reset}>
              <Typography variant="button">Avbryt</Typography>
            </ColorButtonRed>
          </Grid>
        </Grid>
      </Popover>
    );
  };

  reset = () => {
    const { menuItem } = this.props;
    this.setState({
      mapLinkValue: menuItem.maplink,
      linkValue: menuItem.link,
      documentValue: menuItem.document,
      connectionsMenuAnchorEl: null,
    });
  };

  updateSelection = () => {
    const { treeNodeId, updateMenuItem } = this.props;
    const { activeMenu } = this.state;
    let value = this.state.activeMenu;
    let newMenuItem = {
      maplink: "",
      link: "",
      document: "",
    };

    if (activeMenu === MENU_CONNECTION_TYPES.documentConnection) {
      if (!this.state.documentValue) {
        value = MENU_CONNECTION_TYPES.none;
      }
      newMenuItem = { ...newMenuItem, document: this.state.documentValue };
    }

    if (activeMenu === MENU_CONNECTION_TYPES.link) {
      if (!this.state.linkValue) {
        value = MENU_CONNECTION_TYPES.none;
      }
      newMenuItem = { ...newMenuItem, link: this.state.linkValue };
    }

    if (activeMenu === MENU_CONNECTION_TYPES.mapLink) {
      if (!this.state.mapLinkValue) {
        value = MENU_CONNECTION_TYPES.none;
      }
      newMenuItem = { ...newMenuItem, maplink: this.state.mapLinkValue };
    }

    updateMenuItem(treeNodeId, newMenuItem);

    this.setState({
      connectionsMenuAnchorEl: null,
      open: false,
      value: value,
    });
  };

  setSelectedDocument = (index) => {
    const { availableDocuments } = this.props;
    this.setState({ documentValue: availableDocuments[index] });
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
                onClick={() => {
                  this.setSelectedDocument(index);
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
    return this.getLink(MAPLINK_TEXT, this.state.mapLinkValue, (e) => {
      this.setState({ mapLinkValue: e.target.value });
    });
  };

  renderLink = () => {
    return this.getLink(WEBLINK_TEXT, this.state.linkValue, (e) => {
      this.setState({ linkValue: e.target.value });
    });
  };

  renderPopoverContent = () => {
    const { activeMenu } = this.state;

    if (activeMenu === MENU_CONNECTION_TYPES.none) {
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

  handleChange = (target, value) => {
    console.log(this, "this");
    this.props.updateValidationForTreeNode(this.props.treeNodeId);
    if (value !== MENU_CONNECTION_TYPES.none) {
      this.setState({
        activeMenu: value,
        connectionsMenuAnchorEl: target,
        open: true,
      });
    } else {
      this.setState(
        {
          activeMenu: value,
          value: value,
        },
        () => {
          this.updateSelection();
        }
      );
    }
  };

  getDropDownSelectionIcon = (icon) => {
    return (
      icon && (
        <Grid xs={2} item>
          {icon}
        </Grid>
      )
    );
  };

  getRenderedSelectionText = (label, icon) => {
    return (
      <Grid wrap="nowrap" spacing={1} container>
        <Grid item>{this.getDropDownSelectionIcon(icon)}</Grid>
        <Grid xs={8} item>
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
        this.getMenuConnectionTypeIcon(MENU_CONNECTION_TYPES.documentConnection)
      );
    }

    if (this.state.value === MENU_CONNECTION_TYPES.none) {
      return this.getRenderedSelectionText(
        NONE_TEXT,
        this.getMenuConnectionTypeIcon(MENU_CONNECTION_TYPES.none)
      );
    }

    if (this.state.value === MENU_CONNECTION_TYPES.link) {
      return this.getRenderedSelectionText(
        WEBLINK_TEXT,
        this.getMenuConnectionTypeIcon(MENU_CONNECTION_TYPES.link)
      );
    }

    if (this.state.value === MENU_CONNECTION_TYPES.mapLink) {
      return this.getRenderedSelectionText(
        MAP_TEXT,
        this.getMenuConnectionTypeIcon(MENU_CONNECTION_TYPES.mapLink)
      );
    }

    return this.getRenderedSelectionText(NONE_TEXT);
  };

  openDropDown = () => {
    this.setState({ open: true });
  };

  closeDropDown = () => {
    this.setState({ open: false });
  };

  renderWarning = () => {
    return <WarningIcon color="error"></WarningIcon>;
  };

  render = () => {
    const { value, open } = this.state;
    const { valid } = this.props;

    if (value) {
      return (
        <>
          <FormControl>
            <Grid alignItems="center" container>
              {!valid && (
                <Grid xs={2} item>
                  {this.renderWarning()}
                </Grid>
              )}
              <Grid xs={10} item>
                <Select
                  MenuProps={{
                    disableScrollLock: true,
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    getContentAnchorEl: null,
                  }}
                  onOpen={this.openDropDown}
                  onClose={this.closeDropDown}
                  renderValue={this.getRenderValue}
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
