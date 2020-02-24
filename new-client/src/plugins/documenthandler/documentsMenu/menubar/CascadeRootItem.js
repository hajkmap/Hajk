import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import CascadeMenu from "./CascadeMenu";

const styles = theme => ({});

class MenuBarCascadeMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false
  };

  handleClick = e => {
    this.setState({
      anchorEl: e.currentTarget,
      menuOpen: !this.state.menuOpen
    });
  };

  onCloseClick = () => {
    this.setState({
      menuOpen: false
    });
  };

  render() {
    const { toggleHighlight, item } = this.props;

    return (
      <>
        <Button
          onClick={this.handleClick}
          onMouseEnter={toggleHighlight}
          onMouseLeave={toggleHighlight}
          aria-controls="simple-menu"
          aria-haspopup="true"
        >
          {item.title}
        </Button>

        <CascadeMenu
          items={item.menu}
          menuOpen={this.state.menuOpen}
          onClose={this.onCloseClick}
          anchorEl={this.state.anchorEl}
          verticalAnchor="bottom"
          horizontalAnchor="left"
        ></CascadeMenu>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarCascadeMenuItem));
