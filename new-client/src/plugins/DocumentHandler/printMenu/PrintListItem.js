import React from "react";
import { styled } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";

import { withTheme } from "@emotion/react";
import {
  Checkbox,
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PrintList from "./PrintList";

const StyledListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  minWidth: theme.spacing(3),
}));

const StyledCollapseIcon = styled(ListItemIcon)(({ theme }) => ({
  ".MuiListItemIcon-root": {
    minWidth: theme.spacing(4),
  },
}));
const StyledListItem = styled(ListItem)(({ theme }) => ({
  overflowWrap: "break-word",
  ".MuiListItem-root": {
    borderLeft: `${theme.spacing(1)} solid ${theme.palette.background.paper}`,
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
}));

class PrintListItem extends React.PureComponent {
  #getListTitle = () => {
    const { title } = this.props;
    return <ListItemText>{title}</ListItemText>;
  };

  #getCollapseIcon = () => {
    const { title, expanded } = this.props;

    return expanded ? (
      <StyledCollapseIcon>
        {!title && <span style={visuallyHidden}>Minimera submeny</span>}
        <ExpandLess />
      </StyledCollapseIcon>
    ) : (
      <StyledCollapseIcon>
        {!title && <span style={visuallyHidden}>Maximera submeny</span>}
        <ExpandMore />
      </StyledCollapseIcon>
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
      type,
      selected,
      subMenuItems,
      expanded,
      level,
      title,
      id,
      chosenForPrint,
    } = this.props;
    const hasSubMenu = this.#hasSubMenu();
    return (
      <>
        <StyledListItem
          divider
          selected={selected}
          button
          ref={this.props.itemRef}
          size="small"
          disableGutters
          aria-controls={hasSubMenu ? `submenu_${id}` : null}
          aria-expanded={expanded}
          onClick={() => {
            this.#handleMenuButtonClick(type, id);
          }}
          sx={this.#getMenuItemStyle()}
        >
          <StyledListItemIcon>
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
          </StyledListItemIcon>
          {title && this.#getListTitle()}
          {hasSubMenu && this.#getCollapseIcon()}
        </StyledListItem>
        {hasSubMenu && (
          <Collapse id={`submenu_${id}`} in={expanded} timeout={200}>
            <PrintList
              {...this.props}
              level={level + 1}
              documentMenu={subMenuItems}
              handleTogglePrint={this.props.handleTogglePrint}
            ></PrintList>
          </Collapse>
        )}
      </>
    );
  }
}

export default withTheme(PrintListItem);
