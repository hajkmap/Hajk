import React, { Component } from "react";
import BreadCrumb from "./BreadCrumb.js";
import { styled } from "@mui/material/styles";
import { useTheme } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ScrollMenu from "react-horizontal-scrolling-menu";

// A HOC that pipes isMobile to the children. See this as a proposed
// solution. It is not pretty, but if we move this to a separate file
// we could use this HOC instead of the isMobile helper function in ../../utils/.
// TODO: Move to some /hooks folder
const withIsMobile = () => (WrappedComponent) => (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return <WrappedComponent {...props} isMobile={isMobile} />;
};

const MobileRoot = styled("div")(({ theme }) => ({
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[24],
  left: 0,
  bottom: 0,
  right: 0,
  width: "auto",
  zIndex: 2,
}));

const MobileHeader = styled("div")(({ theme }) => ({
  padding: `6px ${theme.spacing(2)}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const BreadCrumbsContainerMobile = styled("div")(({ theme }) => ({
  maxHeight: "300px",
  overflow: "auto",
  [theme.breakpoints.down("sm")]: {
    maxHeight: "110px",
  },
}));

const BreadCrumbsContainer = styled("div")(() => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2,
}));

const MobileBreadCrumbWrapper = styled("div")(({ theme }) => ({
  width: "100%",
  paddingLeft: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
}));

class BreadCrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chapters: null,
      visibleLayers: [],
      open: false,
    };
    this.timer = null; // Timer used to buffer layer-state updates
    props.app.globalObserver.subscribe("informativeLoaded", (chapters) => {
      this.setState({
        chapters: chapters,
      });
    });
  }

  #resetLayerBuffers = () => {
    this.addedLayerBuffer = [];
    this.removedLayerBuffer = [];
  };

  bindLayerEvents = (visibleLayers) => (layer) => {
    if (layer.get("visible")) {
      visibleLayers.push(layer);
    }

    this.setState({
      visibleLayers: visibleLayers,
    });

    this.addedLayerBuffer = [];
    this.removedLayerBuffer = [];

    layer.on("change:visible", (e) => {
      const changedLayer = e.target;
      // Since many layers might be activated at the same time, we have to buffer the state update!
      // First, make sure to clear eventual earlier timer.
      clearTimeout(this.timer);
      // Then we'll create a new one...
      this.timer = setTimeout(() => {
        // The layers that are supposed to be shown are the visible layers from earlier combined with
        // the layers that has been activated recently...
        const allLayers = [
          ...this.state.visibleLayers,
          ...this.addedLayerBuffer,
        ];
        // ... minus the layers that has been deactivated recently!
        const visibleLayers = allLayers.filter((l) => {
          return !this.removedLayerBuffer.some(
            (removedLayer) => l === removedLayer
          );
        });
        // Let's update the state with the currently visible layers!
        this.setState({
          visibleLayers: visibleLayers,
        });
        // Finally we have to make sure to reset the layer buffers.
        this.#resetLayerBuffers();
      }, 0);

      if (this.props.model.clearing) {
        this.setState({
          visibleLayers: [],
        });
      } else {
        if (changedLayer.get("visible")) {
          this.addedLayerBuffer.push(changedLayer);
        } else {
          this.removedLayerBuffer.push(changedLayer);
        }
      }
    });
  };

  getVisibleLayers() {
    return this.props.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return layer.getVisible();
      });
  }

  clear = () => {
    this.props.app.clear();
  };

  componentDidMount() {
    var visibleLayers = [];
    if (this.props.map) {
      this.props.map
        .getLayers()
        .getArray()
        .forEach(this.bindLayerEvents(visibleLayers));
    }
  }

  // Returns all active layers except background layers
  getBreadCrumbCompatibleLayers = () => {
    return this.state.visibleLayers.filter((layer) =>
      ["layer", "group"].includes(layer.get("layerType"))
    );
  };

  toggle = () => {
    this.setState({
      open: !this.state.open,
    });
  };

  renderMobile(layers) {
    const { open } = this.state;
    return (
      <MobileRoot>
        <MobileHeader>
          <Typography>Innehåll i kartan</Typography>
          <IconButton onClick={this.toggle} size="small">
            {open ? <RemoveCircleIcon /> : <AddCircleIcon />}
          </IconButton>
        </MobileHeader>
        {open && <Divider />}
        {!open ? null : (
          <BreadCrumbsContainerMobile>
            {layers.length > 0 ? (
              <Grid
                container
                item
                xs={12}
                justifyContent="center"
                sx={{ marginTop: 1, marginBottom: 1 }}
              >
                <Button variant="contained" onClick={this.clear}>
                  Ta bort allt innehåll
                  <VisibilityOffIcon sx={{ marginLeft: 2 }} />
                </Button>
              </Grid>
            ) : (
              <Typography>
                Använd sökfunktionen eller innehållsmenyn för att visa
                information i kartan.
              </Typography>
            )}
            {layers.map((layer, index) => (
              <MobileBreadCrumbWrapper key={`${layer.get("caption")}-${index}`}>
                <BreadCrumb
                  title={layer.get("caption")}
                  layer={layer}
                  chapters={this.state.chapters}
                  app={this.props.app}
                />
              </MobileBreadCrumbWrapper>
            ))}
          </BreadCrumbsContainerMobile>
        )}
      </MobileRoot>
    );
  }

  renderDesktop(layers) {
    const breadCrumbs = layers.map((layer, index) => (
      <BreadCrumb
        key={`${layer.get("caption")}-${index}`}
        title={layer.get("caption")}
        layer={layer}
        chapters={this.state.chapters}
        app={this.props.app}
      />
    ));
    return (
      <BreadCrumbsContainer>
        <ScrollMenu ref="scrollMenu" data={breadCrumbs} alignCenter={false} />
      </BreadCrumbsContainer>
    );
  }

  render() {
    // We've never been mobile, huh?...
    //const isMobile = this.state.width < 600;
    const layers = this.getBreadCrumbCompatibleLayers();
    if (this.props.isMobile) {
      // We don't want to show the breadcrumbs-summary if there are no layers
      return layers.length > 0 ? this.renderMobile(layers) : null;
    } else {
      return this.renderDesktop(layers);
    }
  }
}

export default withIsMobile()(BreadCrumbs);
