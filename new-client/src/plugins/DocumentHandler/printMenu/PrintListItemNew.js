import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import Icon from "@material-ui/core/Icon";
import ListItem from "@material-ui/core/ListItem";
import Collapse from "@material-ui/core/Collapse";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ExpandLess from "@material-ui/icons/ExpandLess";
import PanelList from "./../panelMenu/PanelList";
import PrintList from "./PrintList";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { Typography, Checkbox } from "@material-ui/core";

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

class PrintListItemNew extends React.PureComponent {
  #getListTitle = () => {
    const { title } = this.props;
    return <ListItemText>{title}</ListItemText>;
  };

  #getCollapseIcon = () => {
    const { classes, title, expanded } = this.props;

    return expanded ? (
      <ListItemIcon classes={{ root: classes.collapseIconRoot }}>
        {!title && <Typography variant="srOnly">Minimera submeny</Typography>}
        <ExpandLess />
      </ListItemIcon>
    ) : (
      <ListItemIcon classes={{ root: classes.collapseIconRoot }}>
        {!title && <Typography variant="srOnly">Maximera submeny</Typography>}
        <ExpandMore />
      </ListItemIcon>
    );
  };

  #hasSubMenu = () => {
    const { subMenuItems } = this.props;
    return subMenuItems && subMenuItems.length > 0;
  };

  #handleMenuButtonClick = (type, id) => {
    const { localObserver } = this.props;
    localObserver.publish(`print-${type}-clicked`, id);
  };

  #getMenuItemStyle = () => {
    const { theme, level, color, colored } = this.props;
    const hasSubMenu = this.#hasSubMenu();
    return colored
      ? {
          paddingLeft: theme.spacing(1) + theme.spacing(level * 3),
          borderLeft: `${theme.spacing(1)}px solid ${color}`,
          paddingRight: hasSubMenu ? 0 : theme.spacing(1),
        }
      : {
          paddingLeft: theme.spacing(1) + theme.spacing(level * 3),
          paddingRight: hasSubMenu ? 0 : theme.spacing(1),
        };
  };

  render() {
    const {
      classes,
      type,
      selected,
      subMenuItems,
      expanded,
      icon,
      level,
      title,
      id,
      chosenForPrint,
    } = this.props;
    const hasSubMenu = this.#hasSubMenu();
    return (
      <>
        <ListItem
          divider
          selected={selected}
          button
          ref={this.props.itemRef}
          size="small"
          classes={{
            root: classes.root,
          }}
          disableGutters
          aria-controls={hasSubMenu ? `submenu_${id}` : null}
          aria-expanded={expanded}
          onClick={() => {
            this.#handleMenuButtonClick(type, id);
          }}
          className={classes.listItem}
          style={this.#getMenuItemStyle()}
        >
          <ListItemIcon className={classes.listItemIcon}>
            <Checkbox
              color="primary"
              checked={chosenForPrint}
              onChange={(e) => {
                this.props.handleTogglePrint(this.props.id);
              }}
              onClick={(e) => e.stopPropagation()}
              edge="start"
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          {title && this.#getListTitle()}
          {hasSubMenu && this.#getCollapseIcon()}
        </ListItem>
        {hasSubMenu && (
          <Collapse id={`submenu_${id}`} in={expanded} timeout={200}>
            <PrintList
              {...this.props}
              level={level + 1}
              documentMenu={subMenuItems}
              handleTogglePrint={this.props.handleTogglePrint}
              //items={subMenuItems}
            ></PrintList>
          </Collapse>
        )}
      </>
    );
  }
}

export default withStyles(styles)(withTheme(PrintListItemNew));
