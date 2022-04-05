import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";

const styles = (theme) => {
  return {
    typography: {
      overflowWrap: "break-word",
    },
    containerContent: {
      backgroundColor: "#eeeeee",
    },
    typographyContainer: {
      padding: theme.spacing(1),
    },
    container: {
      marginBottom: theme.spacing(1),
    },
    divider: {
      backgroundColor: "#786aaf",
      height: "2px",
    },
  };
};

class TextArea extends React.PureComponent {
  renderDivider = () => {
    const { classes, dividerColor } = this.props;
    return (
      <Divider
        className={classes.divider}
        style={{ backgroundColor: dividerColor }}
      ></Divider>
    );
  };

  render = () => {
    const { classes, textAreaContentArray, backgroundColor } = this.props;

    return (
      <>
        <Grid
          id="text-area-content"
          className={classes.container}
          justify="center"
          container
        >
          <Grid
            xs={12}
            className={classes.containerContent}
            style={{
              backgroundColor: backgroundColor,
            }}
            item
          >
            {this.renderDivider()}
            <Grid justify="center" container>
              <Grid
                component="blockquote"
                className={classes.typographyContainer}
                xs={12}
                item
              >
                {textAreaContentArray}
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
