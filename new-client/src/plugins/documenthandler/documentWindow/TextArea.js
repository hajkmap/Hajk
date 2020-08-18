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
  extractBackgroundColorFromTag = tagContent => {
    return this.getAttributeValue(
      tagContent.attributes,
      "data-background-color"
    );
  };

  extractDividerColorFromTag = tagContent => {
    return this.getAttributeValue(tagContent.attributes, "data-divider-color");
  };

  getAttributeValue = (attributes, dataAttributeToFind) => {
    return attributes.getNamedItem(dataAttributeToFind)?.value;
  };

  renderDivider = dividerColor => {
    const { classes } = this.props;
    return (
      <Divider
        className={classes.divider}
        style={{ backgroundColor: dividerColor }}
      ></Divider>
    );
  };

  render = () => {
    const { classes, tagContent } = this.props;
    const children = [...tagContent.children];
    const backgroundColor = this.extractBackgroundColorFromTag(tagContent);
    const dividerColor = this.extractDividerColorFromTag(tagContent);

    return (
      <>
        <Grid className={classes.container} justify="center" container>
          <Grid
            xs={12}
            className={classes.containerContent}
            style={{
              backgroundColor: backgroundColor
            }}
            item
          >
            {this.renderDivider(dividerColor)}
            <Grid justify="center" container>
              <Grid className={classes.typographyContainer} xs={12} item>
                <Typography className={classes.typography}>
                  {tagContent.textContent}
                </Typography>
                {children.map((element, index) => {
                  return (
                    <React.Fragment key={index}>
                      {element.callback(element)}
                    </React.Fragment>
                  );
                })}
              </Grid>
            </Grid>
            {this.renderDivider(dividerColor)}
          </Grid>
        </Grid>
      </>
    );
  };
}

export default withStyles(styles)(TextArea);
