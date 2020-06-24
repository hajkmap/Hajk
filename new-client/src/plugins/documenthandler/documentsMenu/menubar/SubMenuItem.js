import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import CascadeMenu from "./CascadeMenu";
import MenuItem from "@material-ui/core/MenuItem";
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Grid from "@material-ui/core/Grid";
import ListItem from "@material-ui/core/ListItem";
import NestedListItem from "./NestedListItem";

const styles = theme => ({
  menuItem: {
    maxHeight: theme.spacing(6),
    minHeight: theme.spacing(6)
  }
});

class SubMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false
  };

  handleItemClick = event => {
    this.setState({
      anchorEl: event.currentTarget,
      menuOpen: !this.state.menuOpen
    });
  };

  onClose = () => {
    this.setState({ menuOpen: false });
  };

  render() {
    const { item, localObserver, getIcon } = this.props;
    var icon = item.icon ? getIcon(item.icon) : null;
    return (
      <>
        <NestedListItem
          icon={icon}
          title={item.title}
          onClick={this.handleItemClick}
          level={item.level}
          borderColor={item.color}
        ></NestedListItem>
        <CascadeMenu
          localObserver={localObserver}
          menuOpen={this.state.menuOpen}
          items={item.menu}
          anchorEl={this.state.anchorEl}
          onClose={this.onClose}
          verticalAnchor="top"
          horizontalAnchor="right"
        />
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(SubMenuItem));
