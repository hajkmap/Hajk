import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";

const styles = theme => ({});

class MenuBarDocumentMenuItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  render() {
    const { toggleHighlight, handleMenuButtonClick, item } = this.props;
    return (
      <Button
        onClick={handleMenuButtonClick}
        onMouseEnter={toggleHighlight}
        onMouseLeave={toggleHighlight}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        {item.title}
      </Button>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarDocumentMenuItem));
