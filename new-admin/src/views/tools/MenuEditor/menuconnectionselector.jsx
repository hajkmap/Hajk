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
import ListItemIcon from "@material-ui/core/ListItemIcon";
import BlockIcon from "@material-ui/icons/Block";
import Select from "@material-ui/core/Select";
import NativeSelect from "@material-ui/core/NativeSelect";
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

// Accepted type => "DOCUMENT", "LINK", "MAP_LINK" (props)

const CONNECTION_TYPE = {
  DOCUMENT: "DOCUMENT",
  LINK: "LINK",
  MAP_LINK: "MAP_LINK",
  NONE: "NONE",
};

const CONNECTION_INFO = [
  {
    id: CONNECTION_TYPE.DOCUMENT,
    menuValue: "Koppla dokument",
    infoHeader: "",
    icon: <DescriptionIcon />,
  },
  {
    id: CONNECTION_TYPE.LINK,
    menuValue: "Koppla webblänk",
    infoHeader: "Webblänk",
    icon: <LanguageIcon />,
  },
  {
    id: CONNECTION_TYPE.MAP_LINK,
    menuValue: "Koppla karta och lager",
    infoHeader: "Kartlänk",
    icon: <RoomIcon />,
  },
  {
    id: CONNECTION_TYPE.NONE,
    menuValue: "Inget valt",
    infoHeader: "",
    icon: <BlockIcon />,
  },
];

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
    anchorEl: null,
    open: false,
  };

  componentDidMount = () => {
    this.setState({
      menuValue: this.getInitialMenuValue(),
      mapLinkValue: this.props.menuItem.maplink,
      linkValue: this.props.menuItem.link,
      documentValue: this.props.menuItem.document,
    });
  };

  getInitialMenuValue = () => {
    const { menuItem, type } = this.props;

    const typeInfo = this.getConnectionInfoFromId(type);
    const noneInfo = this.getConnectionInfoFromId(CONNECTION_TYPE.NONE);

    switch (type) {
      case CONNECTION_TYPE.DOCUMENT:
        return menuItem.document ? typeInfo.menuValue : noneInfo.menuValue;
      case CONNECTION_TYPE.LINK:
        return menuItem.link ? typeInfo.menuValue : noneInfo.menuValue;
      case CONNECTION_TYPE.MAP_LINK:
        return menuItem.maplink ? typeInfo.menuValue : noneInfo.menuValue;
      default:
        return noneInfo.menuValue;
    }
  };

  getConnectionInfoFromId = (id) => {
    return CONNECTION_INFO.find((i) => i.id === id);
  };

  renderMenuConnections = () => {
    const { anchorEl } = this.state;
    const { classes } = this.props;
    return (
      <Popover
        PaperProps={{ className: classes.paper }}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
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
      anchorEl: null,
    });
  };

  updateSelection = () => {
    const { treeNodeId, menuItem, updateMenuItem, type, folder} = this.props;
    const { menuValue, documentValue, linkValue, mapLinkValue } = this.state;
    const { DOCUMENT, LINK, MAP_LINK, NONE } = CONNECTION_TYPE;

    const noneMenuValue = this.getConnectionInfoFromId(NONE).menuValue;

    const newDocument = menuValue === noneMenuValue ? "" : documentValue;
    const newLink = menuValue === noneMenuValue ? "" : linkValue;
    const newMapLink = menuValue === noneMenuValue ? "" : mapLinkValue;

    const newMenuItem = {
      ...menuItem,
      document: type === DOCUMENT ? newDocument : menuItem.document,
      link: type === LINK ? newLink : menuItem.link,
      maplink: type === MAP_LINK ? newMapLink : menuItem.maplink,
      folder: folder,
    };

    updateMenuItem(treeNodeId, newMenuItem);

    this.setState({
      anchorEl: null,
      open: false,
    });
  };

  setSelectedDocument = (index) => {
    const { availableDocuments } = this.props;
    this.setState({ documentValue: availableDocuments[index] });
  };

  renderFolders() {
    const { folders } = this.props;
    return folders.map((folder, i) => (
      <option key={i}>{folder}</option>
    ));
  }

  handleFolderClick = (event) => {
    const selectedFolder = event.target.value;
    this.props.onFolderSelection(selectedFolder);
}

  renderDocumentList = () => {
    const { availableDocuments, classes } = this.props;
    const { documentValue } = this.state;
    return (
      <Grid item>
        <FormControl fullWidth>
          <NativeSelect
            onChange={(event) => this.handleFolderClick(event)}
            value={this.props.folder}
          >
            <option value="">
            Välj en mapp
            </option>
            {this.renderFolders()}
          </NativeSelect>
        </FormControl>
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
    const label = this.getConnectionInfoFromId(
      CONNECTION_TYPE.MAP_LINK
    ).infoHeader;
    return this.getLink(label, this.state.mapLinkValue, (e) => {
      this.setState({ mapLinkValue: e.target.value });
    });
  };

  renderLink = () => {
    const label = this.getConnectionInfoFromId(CONNECTION_TYPE.LINK).infoHeader;
    return this.getLink(label, this.state.linkValue, (e) => {
      this.setState({ linkValue: e.target.value });
    });
  };

  renderPopoverContent = () => {
    const { DOCUMENT, LINK, MAP_LINK } = CONNECTION_TYPE;
    const documentMenuValue = this.getConnectionInfoFromId(DOCUMENT).menuValue;
    const linkMenuValue = this.getConnectionInfoFromId(LINK).menuValue;
    const mapLinkMenuValue = this.getConnectionInfoFromId(MAP_LINK).menuValue;

    switch (this.state.menuValue) {
      case documentMenuValue:
        return this.renderDocumentList();
      case linkMenuValue:
        return this.renderLink();
      case mapLinkMenuValue:
        return this.renderMapLink();
      default:
        return null;
    }
  };

  handleChange = (target, value) => {
    this.props.updateValidationForTreeNode(this.props.treeNodeId);

    const noneMenuValue = this.getConnectionInfoFromId(
      CONNECTION_TYPE.NONE
    ).menuValue;

    this.setState(
      {
        menuValue: value,
        anchorEl: value !== noneMenuValue ? target : null,
        open: value !== noneMenuValue,
      },
      () => {
        value === noneMenuValue && this.updateSelection();
      }
    );
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

  getRenderValue = () => {
    const { menuValue } = this.state;
    const info = this.getConnectionInfoFromId(this.props.type);

    return (
      <Grid wrap="nowrap" spacing={1} container>
        <Grid item>{this.getDropDownSelectionIcon(info.icon)}</Grid>
        <Grid xs={8} item>
          <Typography noWrap>{menuValue}</Typography>
        </Grid>
      </Grid>
    );
  };

  openDropDown = () => {
    this.setState({
      open: true,
    });
  };

  closeDropDown = () => {
    this.setState({ open: false });
  };

  render = () => {
    const { open, menuValue } = this.state;

    const selectOptions = CONNECTION_INFO.filter(
      (ci) => ci.id === this.props.type || ci.id === CONNECTION_TYPE.NONE
    );

    return menuValue ? (
      <FormControl style={{ maxWidth: "100%", width: "100%" }}>
        <Grid alignItems="center" container>
          <Grid xs={10} item>
            <Select
              style={{ maxWidth: "100%" }}
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
              value={menuValue}
            >
              {selectOptions.map((so) => {
                return (
                  <MenuItem
                    onClick={(e) => {
                      this.handleChange(e.currentTarget, so.menuValue);
                    }}
                    key={so.id}
                    value={so.menuValue}
                  >
                    <ListItemIcon>{so.icon}</ListItemIcon>
                    <Typography noWrap>{so.menuValue}</Typography>
                    {so.id !== CONNECTION_TYPE.NONE && <ArrowRightIcon />}
                  </MenuItem>
                );
              })}
            </Select>
            {this.renderMenuConnections()}
          </Grid>
        </Grid>
      </FormControl>
    ) : null;
  };
}

export default withStyles(styles)(MenuConnectionSelector);
