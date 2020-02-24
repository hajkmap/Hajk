import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import CascadeMenu from "./CascadeMenu";
import MenuItem from "@material-ui/core/MenuItem";
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import Grid from "@material-ui/core/Grid";

const styles = theme => ({});

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
    const { item } = this.props;
    return (
      <>
        <Grid item>
          <MenuItem onClick={this.handleItemClick}>
            {item.title}
            <ArrowRightIcon />
          </MenuItem>
        </Grid>
        <CascadeMenu
          menuOpen={this.state.menuOpen}
          items={item.menu}
          anchorEl={this.state.anchorEl}
          onClose={this.onClose}
          verticalAnchor="bottom"
          horizontalAnchor="right"
        />
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(SubMenuItem));
