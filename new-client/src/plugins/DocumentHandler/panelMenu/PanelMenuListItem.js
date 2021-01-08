import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
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
  root: {
    borderLeft: `${theme.spacing(1)}px solid ${theme.palette.background.paper}`,
    "&.Mui-selected": {
      borderLeftColor: theme.palette.action.selected,
    },
    "&.Mui-selected:hover": {
      borderLeftColor: theme.palette.action.selected,
    },
    "&:hover": {
      borderColor: theme.palette.action.hover,
    },
  },
});

class PanelMenuListItem extends React.PureComponent {
  constructor(props) {
    super(props);
    this.#bindSubscriptions();
  }

  #bindSubscriptions = () => {
    const { localObserver, item, setActiveMenuItems } = this.props;
    localObserver.subscribe("set-active-document", ({ documentName }) => {
      setActiveMenuItems(documentName, item);
    });
  };

  #getListTitle = () => {
    const { item } = this.props;
    return <ListItemText>{item.title}</ListItemText>;
  };

  #getCollapseIcon = () => {
    const { classes, item } = this.props;

    return this.#isExpanded() ? (
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

  #getListIcon = (item) => {
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

  #hasSubMenu = (item) => {
    if (item.menu && item.menu.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  #handleMenuButtonClick = (type, item) => {
    const { localObserver, globalObserver } = this.props;
    localObserver.publish(`${type}-clicked`, item);

    if (type !== "submenu") {
      globalObserver.publish("core.onlyHideDrawerIfNeeded");
    } else {
      this.props.handleExpandClick(item);
    }
  };

  #isExpanded = () => {
    const { expandedIndex, item } = this.props;
    return expandedIndex.indexOf(item.id) > -1;
  };

  #isSelected = () => {
    const { selectedIndex, item } = this.props;
    return selectedIndex === item.id;
  };

  #isColored = () => {
    const { coloredIndex, item } = this.props;
    return coloredIndex.indexOf(item.id) > -1;
  };

  #getMenuItemStyle = () => {
    const { theme, item } = this.props;

    return this.#isColored()
      ? {
          paddingLeft: theme.spacing(1) + theme.spacing(item.level * 3),
          borderLeft: `${theme.spacing(1)}px solid ${item.color}`,
        }
      : {
          paddingLeft: theme.spacing(1) + theme.spacing(item.level * 3),
        };
  };

  render() {
    const {
      item,
      classes,
      type,
      localObserver,
      globalObserver,
      handleExpandClick,
      expandedIndex,
      setActiveMenuItems,
      coloredIndex,
      selectedIndex,
    } = this.props;
    const hasSubMenu = this.#hasSubMenu(item);

    return (
      <>
        <ListItem
          divider
          selected={this.#isSelected()}
          button
          size="small"
          classes={{
            root: classes.root,
          }}
          disableGutters
          aria-controls={hasSubMenu ? `submenu_${item.id}` : null}
          aria-expanded={this.#isExpanded()}
          onClick={() => {
            this.#handleMenuButtonClick(type, item);
          }}
          className={classes.listItem}
          style={this.#getMenuItemStyle()}
        >
          {item.icon ? this.#getListIcon(item) : null}
          {item.title && this.#getListTitle()}
          {hasSubMenu && this.#getCollapseIcon()}
        </ListItem>
        {hasSubMenu && (
          <Collapse
            id={`submenu_${item.id}`}
            in={this.#isExpanded()}
            timeout="auto"
          >
            <PanelList
              localObserver={localObserver}
              globalObserver={globalObserver}
              menu={item.menu}
              handleExpandClick={handleExpandClick}
              expandedIndex={expandedIndex}
              setActiveMenuItems={setActiveMenuItems}
              coloredIndex={coloredIndex}
              selectedIndex={selectedIndex}
            ></PanelList>
          </Collapse>
        )}
      </>
    );
  }
}

export default withStyles(styles)(withTheme(PanelMenuListItem));
