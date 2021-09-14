import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

class FirSearchResultItemView extends React.PureComponent {
  state = {};

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  render() {
    const { classes } = this.props;

    return (
      <>
        <div className={classes.root}>
          <table className={classes.resultItemTable}>
            <tbody>
              <tr>
                <td>Fastighet</td>
                <td>{this.model.get("fastbet") || "\u00A0"}</td>
              </tr>
              <tr>
                <td>Område</td>
                <td>{this.model.get("omrade") || "\u00A0"}</td>
              </tr>
              <tr>
                <td>Ägare</td>
                <td>{this.model.get("namn1") || "\u00A0"}</td>
              </tr>
              <tr>
                <td>Ägare</td>
                <td>{this.model.get("namn2") || "\u00A0"}</td>
              </tr>
              <tr>
                <td>Ägare</td>
                <td>{this.model.get("namn3") || "\u00A0"}</td>
              </tr>
              <tr>
                <td>Notering ägare</td>
                <td>{this.model.get("agare_notering") || "\u00A0"}</td>
              </tr>
              <tr>
                <td>Fastighetsadress</td>
                <td>{this.model.get("fastighetsadress") || "\u00A0"}</td>
              </tr>
              <tr>
                <td>Registrerad totalarea (m2)</td>
                <td>{this.model.get("totalarea") || "\u00A0"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  }
}

const styles = (theme) => ({
  root: {},
  resultItemTable: {
    borderSpacing: 0,
    width: "100%",
    marginBottom: theme.spacing(2),
    "& tr:nth-child(even) td": {
      backgroundColor: theme.palette.type === "dark" ? "#565656" : "#ececec",
    },
    "& tr td:first-child": {
      fontWeight: 500,
    },
    "& td": {
      verticalAlign: "top",
      padding: "2px 6px",
    },
  },
  urlList: {
    "& a": {
      display: "block",
      padding: "2px 0",
    },
  },
});

export default withStyles(styles)(withSnackbar(FirSearchResultItemView));
