import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import clsx from "clsx";
import Icon from "@material-ui/core/Icon";
import ListItem from "@material-ui/core/ListItem";
import Collapse from "@material-ui/core/Collapse";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ExpandLess from "@material-ui/icons/ExpandLess";
import PanelList from "./PanelList";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { Typography } from "@material-ui/core";

const styles = (theme) => ({
  listItem: { overflowWrap: "break-word" },
  listItemIcon: { minWidth: theme.spacing(3) },
  collapseIconRoot: { minWidth: theme.spacing(4) },
});

class PanelMenuListItem extends React.PureComponent {
  state = {
    selected: false,
    openSubMenu: false,
    colorActive: false,
  };

  hasActiveSiblings = (documentName) => {
    const { item } = this.props;
    return (
      item.parent && this.hasActiveSubmenuItem(item.parent.menu, documentName)
    );
  };

  isActiveDocument = (documentName) => {
    const { item } = this.props;
    return documentName === item.document;
  };

  isColorActive = (documentName) => {
    const { item } = this.props;
    return (
      this.isActiveDocument(documentName) ||
      this.hasActiveSubmenuItem(item.menu, documentName) ||
      this.hasActiveSiblings(documentName)
    );
  };

  makeListItemSelected = ({ documentName }) => {
    const { item } = this.props;

    let openSubMenu =
      this.hasSubMenu(item) &&
      this.hasActiveSubmenuItem(item.menu, documentName)
        ? true
        : this.state.openSubMenu;

    this.setState({
      selected: documentName === item.document,
      openSubMenu: openSubMenu,
      colorActive: this.isColorActive(documentName),
    });
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("set-active-document", this.makeListItemSelected);
  };

  constructor(props) {
    super(props);
    this.bindSubscriptions();
  }

  hasActiveSubmenuItem = (menu, documentName) => {
    return menu.some((item) => {
      if (this.hasSubMenu(item)) {
        return this.hasActiveSubmenuItem(item.menu, documentName);
      }
      return documentName === item.document;
    });
  };

  getListTitle = () => {
    const { item } = this.props;
    return <ListItemText>{item.title}</ListItemText>;
  };

  getCollapseIcon = () => {
    const { classes, item } = this.props;
    return this.state.openSubMenu ? (
      <ListItemIcon classes={{ root: classes.collapseIconRoot }}>
        {!item.title && (
          <Typography variant="srOnly">Minimera submeny</Typography>
        )}
        <ExpandLess />
      </ListItemIcon>
    ) : (
      <ListItemIcon classes={{ root: classes.collapseIconRoot }}>
        {!item.title && (
          <Typography variant="srOnly">Maximera submeny</Typography>
        )}
        <ExpandMore />
      </ListItemIcon>
    );
  };

  getListIcon = (item) => {
    const { classes } = this.props;
    return (
      <ListItemIcon className={classes.listItemIcon}>
        {!item.title && (
          <Typography variant="srOnly">{item.icon.descriptiveText}</Typography>
        )}
        <Icon style={{ fontSize: item.icon.fontSize }}>
          {item.icon.materialUiIconName}
        </Icon>
      </ListItemIcon>
    );
  };

  hasSubMenu = (item) => {
    if (item.menu && item.menu.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  handleMenuButtonClick = (type, item) => {
    const { localObserver, globalObserver } = this.props;
    localObserver.publish(`${type}-clicked`, item);
    if (type !== "submenu") {
      globalObserver.publish("core.onlyHideDrawerIfNeeded");
    } else {
      this.setState({
        openSubMenu: !this.state.openSubMenu,
      });
    }
  };

  render() {
    const {
      item,
      classes,
      theme,
      type,
      localObserver,
      globalObserver,
    } = this.props;
    const hasSubmenu = this.hasSubMenu(item);
    let style = this.state.colorActive
      ? {
          paddingLeft: theme.spacing(1) + theme.spacing(item.level * 3),
          borderLeft: `${theme.spacing(1)}px solid ${item.color}`,
        }
      : {
          paddingLeft: theme.spacing(1) + theme.spacing(item.level * 3),
        };

    const { selected } = this.state;
    return (
      <>
        <ListItem
          divider
          selected={selected}
          button
          size="small"
          disableGutters
          aria-controls={hasSubmenu ? `${item.id}` : null}
          onClick={() => {
            this.handleMenuButtonClick(type, item);
          }}
          className={classes.listItem}
          style={style}
        >
          {item.icon ? this.getListIcon(item) : null}
          {item.title && this.getListTitle()}
          {hasSubmenu && this.getCollapseIcon()}
        </ListItem>
        {hasSubmenu && (
          <Collapse
            aria-expanded={this.state.openSubMenu}
            id={item.id}
            in={this.state.openSubMenu}
            timeout="auto"
          >
            <PanelList
              localObserver={localObserver}
              globalObserver={globalObserver}
              menu={item.menu}
            ></PanelList>
          </Collapse>
        )}
      </>
    );
  }
}

export default withStyles(styles)(withTheme(PanelMenuListItem));
