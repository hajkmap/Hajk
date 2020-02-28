import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  button: {
    height: "100%"
  }
});

class BarMenuItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  render() {
    const {
      toggleHighlight,
      handleMenuButtonClick,
      item,
      classes
    } = this.props;
    return (
      <Grid
        style={{ backgroundColor: item.color }}
        key={item.title}
        zeroMinWidth
        item
        lg
      >
        <Button
          fullWidth
          className={classes.button}
          onClick={handleMenuButtonClick}
          onMouseEnter={toggleHighlight}
          onMouseLeave={toggleHighlight}
          aria-controls="simple-menu"
          aria-haspopup="true"
        >
          <Typography variant="button">{item.title}</Typography>
        </Button>
      </Grid>
    );
  }
}

export default withStyles(styles)(withSnackbar(BarMenuItem));
