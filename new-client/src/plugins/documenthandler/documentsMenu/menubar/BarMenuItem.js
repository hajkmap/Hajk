import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  menuItem: {
    height: "100%"
  },
  typography: { whiteSpace: "pre-line", margin: theme.spacing(1) }
});

class BarMenuItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  getButton = () => {
    const {
      toggleHighlight,
      handleMenuButtonClick,
      item,
      getIcon,

      classes
    } = this.props;

    var icon = item.icon ? getIcon(item.icon) : null;

    return (
      <MenuItem
        className={classes.menuItem}
        onClick={handleMenuButtonClick}
        onMouseEnter={toggleHighlight}
        onMouseLeave={toggleHighlight}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        {icon}
        {item.title && (
          <Typography className={classes.typography} variant="button">
            {item.title}
          </Typography>
        )}
      </MenuItem>
    );
  };

  render() {
    const { item } = this.props;

    return (
      <Grid
        style={{ backgroundColor: item.color }}
        key={item.title}
        zeroMinWidth
        item
        lg
      >
        {this.getButton()}
      </Grid>
    );
  }
}

export default withStyles(styles)(withSnackbar(BarMenuItem));
