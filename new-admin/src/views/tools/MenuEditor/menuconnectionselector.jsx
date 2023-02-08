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

const MENU_CONNECTION_TYPES1 = {
    documentConnection: "Koppla dokument",
    none: "Inget valt",
  };

  const MENU_CONNECTION_TYPES2 = {
    mapLink: "Koppla karta och lager",
    none: "Inget valt",
  };

  const MENU_CONNECTION_TYPES3 = {
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
    menuconnector: this.props.menuconnector,
  };

  componentDidMount = () => {
    this.setState({
      value: this.getInitialValue(),
    });
  };

  getInitialValue = () => {
    const { menuItem } = this.props;
    const { menuconnector } = this.state;

    if (menuItem.document !== "" && menuconnector === 1) {
      return MENU_CONNECTION_TYPES.documentConnection;
    }

    if (menuItem.link && menuconnector === 3) {
      return MENU_CONNECTION_TYPES.link;
    }

    if (menuItem.maplink && menuconnector === 2) {
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

  renderMenuConnectionSettingsDoc = () => {
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
              onClick={this.updateSelectionDoc}
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

  renderMenuConnectionSettingsMap = () => {
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
              onClick={this.updateSelectionMap}
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

  renderMenuConnectionSettingsLink = () => {
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
              onClick={this.updateSelectionLink}
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

  updateSelectionDoc = () => {
    const { treeNodeId, updateMenuItem } = this.props;
    const { activeMenu } = this.state;
    let value = this.state.activeMenu;
    let newMenuItem = {
      document: "",
    };

    newMenuItem = { ...newMenuItem, document: this.state.documentValue };

    if (activeMenu === MENU_CONNECTION_TYPES.none) {
      
      newMenuItem = { ...newMenuItem, document: "" };
      
    }
    
    updateMenuItem(treeNodeId, newMenuItem);

    this.setState({
      connectionsMenuAnchorEl: null,
      open: false,
      value: value,
    });
  };

    updateSelectionMap = () => {
        const { treeNodeId, updateMenuItem } = this.props;
        const { activeMenu } = this.state;
        let value = this.state.activeMenu;
        let newMenuItem = {
          maplink: "",
        };
    
        newMenuItem = { ...newMenuItem, maplink: this.state.mapLinkValue };
    
        if (activeMenu === MENU_CONNECTION_TYPES.none) {
          newMenuItem = { ...newMenuItem, maplink: "" };
        }
    
        updateMenuItem(treeNodeId, newMenuItem);
    
        this.setState({
          connectionsMenuAnchorEl: null,
          open: false,
          value: value,
        });
      };

      updateSelectionLink = () => {
        const { treeNodeId, updateMenuItem } = this.props;
        const { activeMenu } = this.state;
        let value = this.state.activeMenu;
        let newMenuItem = {
          link: "",
        };
    
        newMenuItem = { ...newMenuItem, link: this.state.linkValue };
    
        if (activeMenu === MENU_CONNECTION_TYPES.none) {
            newMenuItem = { ...newMenuItem, link: "" };
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
    const { menuconnector } = this.state;

    if (activeMenu === MENU_CONNECTION_TYPES.none) {
      return null;
    }
    if (activeMenu === MENU_CONNECTION_TYPES.documentConnection && menuconnector === 1) {
      return this.renderDocumentList();
    }

    if (activeMenu === MENU_CONNECTION_TYPES.link && menuconnector === 3) {
      return this.renderLink();
    }

    if (activeMenu === MENU_CONNECTION_TYPES.mapLink && menuconnector === 2) {
      return this.renderMapLink();
    }
  };

  handleChange = (target, value) => {
    const { menuconnector } = this.state;

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
            if(menuconnector === 1)
            {
                this.updateSelectionDoc();
            }
            else if(menuconnector === 2)
            {
                this.updateSelectionMap();
            }
            else if(menuconnector === 3)
            {
                this.updateSelectionLink();
            }
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
    this.setState({ 
        open: true,
    });
  };

  closeDropDown = () => {
    this.setState({ open: false });
  };

  renderWarning = () => {
    return <WarningIcon color="error"></WarningIcon>;
  };

  render = () => {
    const { value, open } = this.state;
    const { activeMenu } = this.state;
    const { menuconnector } = this.state;

    if (value) {
      return (
        <>
          <FormControl>
            <Grid alignItems="center" container>
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
                  {menuconnector === 1 ?                  
                  Object.values(MENU_CONNECTION_TYPES1).map((value, index) => {
                    return this.renderConnectionMenuSelectOption(value, index);
                  })
                  : menuconnector === 2 ?
                  Object.values(MENU_CONNECTION_TYPES2).map((value, index) => {
                    return this.renderConnectionMenuSelectOption(value, index);
                  })
                  :
                  Object.values(MENU_CONNECTION_TYPES3).map((value, index) => {
                    return this.renderConnectionMenuSelectOption(value, index);
                  })
                }
                </Select>
                {activeMenu === MENU_CONNECTION_TYPES.documentConnection ?                
                this.renderMenuConnectionSettingsDoc()
                : activeMenu === MENU_CONNECTION_TYPES.mapLink ?
                this.renderMenuConnectionSettingsMap()
                : activeMenu === MENU_CONNECTION_TYPES.link ?
                this.renderMenuConnectionSettingsLink()
                : 
                this.renderMenuConnectionSettingsDoc()
                }
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