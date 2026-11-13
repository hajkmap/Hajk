import React from "react";
import { styled } from "@mui/material/styles";
import { Attribution } from "ol/control";
import { getIsMobile } from "../utils/IsMobile";

const Root = styled("div")(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  boxShadow: theme.shadows[4],
  "& .ol-control": {
    position: "static",
    maxWidth: "none",
    "& button": {
      cursor: "pointer",
      boxShadow: "none",
      outline: "none",
      marginTop: "-1px",
      color: theme.palette.text.primary,
      background: "transparent",
      "&:hover, &:focus, &:focus-visible": {
        outline: "none",
        boxShadow: "none",
        color: theme.palette.text.primary,
      },
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
  "& .ol-attribution": {
    background: theme.palette.background.paper,
    height: "25px",
    overflowX: "auto",
    overflowY: "hidden",
    whiteSpace: "nowrap",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100px",
    },
    "& ul": {
      fontSize: "0.7em",
      color: "unset",
      textShadow: "unset",
    },
    "& a": {
      color:
        theme.palette.mode === "dark"
          ? theme.palette.primary.light
          : theme.palette.primary.main,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  "& .ol-attribution:not(.ol-collapsed)": {
    background: theme.palette.background.paper,
  },
  "& .ol-attribution-expand": {
    marginTop: "1px",
    display: "inline-block",
    background: "transparent",
    color: theme.palette.text.primary,
    "&:hover, &:focus, &:focus-visible": {
      outline: "none",
      color: theme.palette.text.primary,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

class AttributionControl extends React.PureComponent {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidUpdate() {
    // Go on only if map exists AND we haven't done this yet.
    // Without the children.length part, we'd do this all the
    // time as we're inside componentDidUpdate.
    if (this.props.map && this.ref.current.children.length === 0) {
      // collapsible must be set explicitly. This is a workaround for an
      // OpenLayers change, not a Hajk regression: until OL 6–7 the control
      // only considered visible layers, so a hidden OSM background left the
      // ©/› toggle alone. From OL 9 (Hajk ~2024-04) it uses getAllLayers()
      // and any source with attributionsCollapsible: false (OSM does this)
      // hides the button on every render, even when that layer is not shown.
      // collapsed: false on desktop so the text is visible on load; on
      // mobile we start collapsed (© only) to save footer space.
      const attributionControl = new Attribution({
        target: this.ref.current,
        tipLabel: "Visa/dölj copyrightinformation för kartdata",
        label: "©",
        collapsible: true,
        collapsed: getIsMobile(),
      });
      this.props.map.addControl(attributionControl);
    }
  }

  render() {
    return <Root ref={this.ref} />;
  }
}

export default AttributionControl;
