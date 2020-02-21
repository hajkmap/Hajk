import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import CascadeMenu from "./CascadeMenu";
import MenuItem from "@material-ui/core/MenuItem";
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";

const styles = theme => ({});

class SubMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false
  };

  handleItemClick = event => {
    console.log(event.currentTarget, "currentTarget");
    this.setState({
      anchorEl: event.currentTarget,
      menuOpen: !this.state.menuOpen
    });
  };

  render() {
    const { menuItems, title } = this.props;
    return (
      <>
        <MenuItem onClick={this.handleItemClick}>
          {title}
          <ArrowRightIcon />
        </MenuItem>
        <CascadeMenu
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          menuOpen={this.state.menuOpen}
          menuItems={menuItems}
          anchorEl={this.state.anchorEl}
          onClose={this.handleSubMenuClose}
        />
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(SubMenuItem));
