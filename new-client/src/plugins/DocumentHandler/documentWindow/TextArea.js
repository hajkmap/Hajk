import React from "react";
import withStyles from "@mui/styles/withStyles";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";

const styles = (theme) => {
  return {
    typography: {
      overflowWrap: "break-word",
    },
    containerContent: {
      //Need to manually change color when switching between dark/light-mode
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.grey[700]
          : theme.palette.grey[200],
    },
    typographyContainer: {
      padding: theme.spacing(1),
    },
    container: {
      marginBottom: theme.spacing(1),
    },
    divider: {
      //Need to manually change color when switching between dark/light-mode
      backgroundColor:
        theme.palette.mode === "dark"
          ? theme.palette.grey[200]
          : theme.palette.grey[400],
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
          justifyContent="center"
          container
        >
          <Grid
            xs={12}
            className={classes.containerContent}
            style={{ backgroundColor: backgroundColor }}
            item
          >
            {this.renderDivider()}
            <Grid justifyContent="center" container>
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
