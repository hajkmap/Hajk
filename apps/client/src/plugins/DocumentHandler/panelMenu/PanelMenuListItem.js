import React from "react";
import { styled } from "@mui/material/styles";
import { withTheme } from "@emotion/react";
import Icon from "@mui/material/Icon";
import ListItem from "@mui/material/ListItem";
import Collapse from "@mui/material/Collapse";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ExpandLess from "@mui/icons-material/ExpandLess";
import PanelList from "./PanelList";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { visuallyHidden } from "@mui/utils";

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

class PanelMenuListItem extends React.PureComponent {
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

  #getListIcon = () => {
    const { title, icon } = this.props;
    return (
      <StyledListItemIcon>
        {!title && <span style={visuallyHidden}>{icon.descriptiveText}</span>}
        <Icon style={{ fontSize: icon.fontSize }}>
          {icon.materialUiIconName}
        </Icon>
      </StyledListItemIcon>
    );
  };

  #hasSubMenu = () => {
    const { subMenuItems } = this.props;
    return subMenuItems && subMenuItems.length > 0;
  };

  #handleMenuButtonClick = (type, id) => {
    const { localObserver } = this.props;
    localObserver.publish(`${type}-clicked`, id);
  };

  #getMenuItemStyle = () => {
    const { theme, level, color, colored } = this.props;
    const hasSubMenu = this.#hasSubMenu();
    return colored
      ? {
          paddingLeft: theme.spacing(1 + level * 3),
          borderLeft: `${theme.spacing(1)} solid ${color}`,
          paddingRight: hasSubMenu ? 0 : theme.spacing(1),
        }
      : {
          paddingLeft: theme.spacing(1 + level * 3),
          paddingRight: hasSubMenu ? 0 : theme.spacing(1),
        };
  };

  render() {
    const { type, selected, subMenuItems, expanded, icon, level, title, id } =
      this.props;
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
          {icon ? this.#getListIcon() : null}
          {title && this.#getListTitle()}
          {hasSubMenu && this.#getCollapseIcon()}
        </StyledListItem>
        {hasSubMenu && (
          <Collapse id={`submenu_${id}`} in={expanded} timeout={200}>
            <PanelList
              {...this.props}
              level={level + 1}
              items={subMenuItems}
            ></PanelList>
          </Collapse>
        )}
      </>
    );
  }
}

export default withTheme(PanelMenuListItem);
