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

class MenuBarItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.globalObserver = this.props.app.globalObserver;
  }

  render() {
    const { toggleHighlight, handleMenuButtonClick, header } = this.props;
    return (
      <Button
        onClick={() => {
          handleMenuButtonClick(header);
        }}
        onMouseEnter={toggleHighlight}
        onMouseLeave={toggleHighlight}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        {header}
      </Button>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarItem));
