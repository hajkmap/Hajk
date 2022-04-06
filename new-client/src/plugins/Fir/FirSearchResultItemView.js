import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import propFilters from "components/FeatureInfo/FeaturePropsFilters";

const styles = (theme) => ({
  root: {
    "& table": {
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
    "& ul": {
      display: "block",
      listStyle: "none",
      paddingLeft: 0,
      paddingTop: theme.spacing(1),
      "& a": {
        display: "inline-block",
        padding: "2px 0",
      },
    },
  },
});

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
    this.rootModel = this.props.rootModel;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.propFilters = propFilters;
  }

  getTemplate = () => {
    return this.rootModel.config.resultsList.template;
  };

  getHtml = () => {
    const props = this.model.getProperties(); // model is a feature in this case...
    const nbsp = "\u00A0";
    let s = this.getTemplate();
    const regex = /\{[a-zA-Z_0-9|\-()]+\}/gm;
    let m;

    while ((m = regex.exec(s)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      for (let index = 0; index < m.length; index++) {
        const match = m[index];
        let v = this.propFilters.applyFilters(
          props,
          match.replace("{", "").replace("}", "")
        );
        if (v === "") {
          v = nbsp;
        }
        s = s.replace(match, v);
      }
    }

    return s;
  };

  render() {
    const { classes } = this.props;

    return (
      <>
        <div
          className={classes.root}
          dangerouslySetInnerHTML={{ __html: this.getHtml() }}
        ></div>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(FirSearchResultItemView));
