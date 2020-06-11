import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";

import Grid from "@material-ui/core/Grid";

import Typography from "@material-ui/core/Typography";

const styles = theme => {
  return {
    typography: {
      overflowWrap: "break-word"
    },
    containerContent: {
      backgroundColor: "#eeeeee"
    },
    typographyContainer: {
      padding: theme.spacing(1)
    },
    divider: {
      backgroundColor: "#786aaf",
      height: "2px"
    },
    container: {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2)
    }
  };
};

class TextArea extends React.PureComponent {
  renderDivider = () => {
    const { dividerColor, classes } = this.props;
    return (
      <Divider
        className={classes.divider}
        style={{ backgroundColor: dividerColor }}
      ></Divider>
    );
  };

  render = () => {
    const { classes, text, backgroundColor } = this.props;

    return (
      <>
        <Grid className={classes.container} justify="center" container>
          <Grid
            xs={8}
            className={classes.containerContent}
            style={{
              backgroundColor: backgroundColor
            }}
            item
          >
            {this.renderDivider()}
            <Grid justify="center" container>
              <Grid className={classes.typographyContainer} xs={8} item>
                <Typography className={classes.typography}>{text}</Typography>
              </Grid>
            </Grid>
            {this.renderDivider()}
          </Grid>
        </Grid>
      </>
    );
  };
}

export default withStyles(styles)(TextArea);
