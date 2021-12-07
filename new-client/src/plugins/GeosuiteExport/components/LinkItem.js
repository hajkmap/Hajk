import React from "react";
import PropTypes from "prop-types";
import { withStyles, Link } from "@material-ui/core";

const styles = (theme) => ({
  listItemContainer: {
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
  },
});

class LinkItem extends React.PureComponent {
  static propTypes = {
    link: PropTypes.object.isRequired,
  };

  render() {
    const { classes, link } = this.props;

    return (
      <>
        <div key={link.id} className={classes.listItemContainer}>
          <div className={classes.listItem}>
            <Link
              href={link.link}
              target="_blank"
              rel="noreferrer"
            >{`${link.title}`}</Link>
          </div>
        </div>
      </>
    );
  }
}
export default withStyles(styles)(LinkItem);
