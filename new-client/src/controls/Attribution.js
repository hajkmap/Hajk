import React from "react";
import { styled } from "@mui/material/styles";
import { Attribution } from "ol/control";

import { withTranslation } from "react-i18next";

const Root = styled("div")(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: "2px",
  "& .ol-control": {
    position: "static",
    maxWidth: "none",
    "& button": {
      cursor: "pointer",
      boxShadow: "none",
      outline: "none",
    },
    "& :hover": {
      background: theme.palette.background.paper,
    },
  },
  "& .ol-attribution": {
    background: theme.palette.background.paper,
    boxShadow: theme.shadows[4],
    borderRadius: theme.shape.borderRadius,
    height: "25px",
    overflow: "auto",
    whiteSpace: "nowrap",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100px",
    },
    "& ul": {
      fontSize: "0.7em",
      color: "unset",
      textShadow: "unset",
    },
  },
  "& .ol-attribution:not(.ol-collapsed)": {
    background: theme.palette.background.paper,
  },
}));

class AttributionControl extends React.PureComponent {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidUpdate() {
    const { t } = this.props;
    // Go on only if map exists AND we haven't done this yet.
    // Without the children.length part, we'd do this all the
    // time as we're inside componentDidUpdate.
    if (this.props.map && this.ref.current.children.length === 0) {
      const attributionControl = new Attribution({
        target: this.ref.current,
        tipLabel: t("controls.attribution.tipLabel"),
        label: t("controls.attribution.label"),
      });
      this.props.map.addControl(attributionControl);
    }
  }

  render() {
    return <Root ref={this.ref} />;
  }
}

export default withTranslation()(AttributionControl);
