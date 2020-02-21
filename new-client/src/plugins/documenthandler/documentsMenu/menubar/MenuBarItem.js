import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";

const styles = theme => ({
  menuItem: {
    height: theme.spacing(20),
    maxWidth: theme.spacing(36),
    minWidth: theme.spacing(22),
    margin: theme.spacing(1),
    opacity: "0.8",
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      maxWidth: "none",
      height: theme.spacing(10)
    }
  },
  noTransparency: {
    opacity: 1
  },
  gridContainer: {
    height: "100%"
  }
});

class MenuBarDocumentMenuItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  handleClick = () => {
    const { localObserver, title } = this.props;
    //localObserver.publish("show-submenu", title);
  };

  render() {
    const { toggleHighlight, handleMenuButtonClick, title } = this.props;
    return (
      <Button
        onClick={() => {
          handleMenuButtonClick(title);
        }}
        onMouseEnter={toggleHighlight}
        onMouseLeave={toggleHighlight}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        {title}
      </Button>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarDocumentMenuItem));
