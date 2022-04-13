import React from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import PanelHeader from "./PanelHeader";
import { Rnd } from "react-rnd";
import { isMobile, getIsMobile } from "../utils/IsMobile.js";
import FeatureInfoContainer from "./FeatureInfo/FeatureInfoContainer.js";
import clsx from "clsx";

const zIndexStart = 1000;
// Patch the RND component's onDragStart method with the ability to disable drag by its internal state.
// This is necessary so we can disable/enable drag at any time.
//
// Please note that since we override the onDragStart on prototype level, we must ensure that it's
// kept up-to-date with the current version, see https://github.com/bokuweb/react-rnd/blob/master/src/index.tsx
// for latest version of this method.
//
// TODO: Perhaps there's no need to disable drag at any time anymore, so this override could be removed?
//
Rnd.prototype.onDragStart = function (e, data) {
  if (this.state.disableDrag) {
    return false;
  }

  if (this.props.onDragStart) {
    this.props.onDragStart(e, data);
  }
  if (!this.props.bounds) return;
  const parent = this.getParent();
  const scale = this.props.scale;
  let boundary;
  if (this.props.bounds === "parent") {
    boundary = parent;
  } else if (this.props.bounds === "body") {
    const parentRect = parent.getBoundingClientRect();
    const parentLeft = parentRect.left;
    const parentTop = parentRect.top;
    const bodyRect = document.body.getBoundingClientRect();
    const left =
      -(parentLeft - parent.offsetLeft * scale - bodyRect.left) / scale;
    const top = -(parentTop - parent.offsetTop * scale - bodyRect.top) / scale;
    const right =
      (document.body.offsetWidth - this.resizable.size.width * scale) / scale +
      left;
    const bottom =
      (document.body.offsetHeight - this.resizable.size.height * scale) /
        scale +
      top;
    return this.setState({ bounds: { top, right, bottom, left } });
  } else if (this.props.bounds === "window") {
    if (!this.resizable) return;
    const parentRect = parent.getBoundingClientRect();
    const parentLeft = parentRect.left;
    const parentTop = parentRect.top;
    const left = -(parentLeft - parent.offsetLeft * scale) / scale;
    const top = -(parentTop - parent.offsetTop * scale) / scale;
    const right =
      (window.innerWidth - this.resizable.size.width * scale) / scale + left;
    const bottom =
      (window.innerHeight - this.resizable.size.height * scale) / scale + top;
    return this.setState({ bounds: { top, right, bottom, left } });
  } else {
    boundary = document.querySelector(this.props.bounds);
  }
  if (!(boundary instanceof HTMLElement) || !(parent instanceof HTMLElement)) {
    return;
  }
  const boundaryRect = boundary.getBoundingClientRect();
  const boundaryLeft = boundaryRect.left;
  const boundaryTop = boundaryRect.top;
  const parentRect = parent.getBoundingClientRect();
  const parentLeft = parentRect.left;
  const parentTop = parentRect.top;
  const left = (boundaryLeft - parentLeft) / scale;
  const top = boundaryTop - parentTop;
  if (!this.resizable) return;
  this.updateOffsetFromParent();
  const offset = this.offsetFromParent;
  this.setState({
    bounds: {
      top: top - offset.top,
      right:
        left +
        (boundary.offsetWidth - this.resizable.size.width) -
        offset.left / scale,
      bottom:
        top + (boundary.offsetHeight - this.resizable.size.height) - offset.top,
      left: left - offset.left / scale,
    },
  });
};

const styles = (theme) => {
  return {
    window: {
      zIndex: zIndexStart + document.windows.length,
      position: "absolute",
      background: theme.palette.background.paper,
      boxShadow: theme.shadows[24],
      borderRadius: theme.shape.borderRadius,
      overflow: "hidden",
      pointerEvents: "all",
      [theme.breakpoints.down("xs")]: {
        borderRadius: "0",
        position: "fixed !important",
      },
    },
    panelContent: {
      display: "flex",
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      flexDirection: "column",
      userSelect: "none",
      outline: "none",
      '& a:not([class*="Mui"])': {
        color: theme.palette.primary.light,
      },
    },
    panelContentDisplayContents: {
      display: "contents",
    },
    content: {
      flex: "1",
      overflowY: "auto",
      padding: "10px",
      cursor: "default !important",
    },
    nonScrollable: {
      overflowY: "hidden",
      padding: "0px",
    },
  };
};

class Window extends React.PureComponent {
  static propTypes = {
    children: propTypes.object,
    classes: propTypes.object.isRequired,
    color: propTypes.string,
    features: propTypes.array,
    globalObserver: propTypes.object.isRequired,
    height: propTypes.oneOfType([propTypes.number, propTypes.string])
      .isRequired,
    layerswitcherConfig: propTypes.object,
    map: propTypes.object,
    mode: propTypes.string.isRequired,
    onClose: propTypes.func.isRequired,
    onDisplay: propTypes.func,
    onResize: propTypes.func,
    open: propTypes.bool.isRequired,
    position: propTypes.string.isRequired,
    title: propTypes.string.isRequired,
    width: propTypes.number.isRequired,
  };

  static defaultProps = {
    draggingEnabled: true,
    resizingEnabled: true,
    allowMaximizedWindow: false,
    scrollable: true,
  };

  constructor(props) {
    super(props);
    document.windows.push(this);
    this.windowRef = React.createRef();
    this.state = {
      left: 0,
      top: 0,
      width: 300,
      height: this.props.height === "dynamic" ? "auto" : 400,
    };

    window.addEventListener("resize", () => {
      if (this.state.mode === "maximized") {
        this.fit(document.getElementById("windows-container"));
      } else {
        this.updatePosition();
      }
    });
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.open === false && this.props.open === true) {
      //This is ugly but there is a timing problem further down somewhere (i suppose?).
      //componentDidUpdate is run before the render is actually fully completed and the DOM is ready
      setTimeout(() => {
        this.windowRef.current.focus();
      }, 200);
    }
  };

  componentDidMount() {
    const { globalObserver } = this.props;
    if (globalObserver) {
      globalObserver.subscribe("core.appLoaded", () => {
        this.updatePosition();
      });
      globalObserver.subscribe("core.drawerToggled", () => {
        this.updatePosition();
      });
      globalObserver.subscribe("core.dialogOpen", (open) => {
        this.rnd.setState({
          disableDrag: open,
        });
      });
    }
  }

  /**
   * In LayerSwitcher plugin's settings, there's an option that allows
   * user to show or hide the so called "breadcrumbs": small boxes, one
   * for each active layer, that show up at the bottom of the screen.
   *
   * If breadcrumbs are activated, we should ensure that our Windows
   * don't hide breadcrumbs, by reducing Windows' default height slightly.
   *
   * This helper is used to determine whether breadcrumbs are activated
   * or not.
   *
   * @returns boolean
   * @memberof Window
   */
  areBreadcrumbsActivated() {
    return this.props.layerswitcherConfig &&
      this.props.layerswitcherConfig.hasOwnProperty("options")
      ? this.props.layerswitcherConfig.options.showBreadcrumbs
      : false;
  }

  getMaxWindowHeight() {
    if (this.rnd === undefined) return 400;
    const parent = this.rnd.getSelfElement().parentElement;
    const spaceForBreadcrumbs = this.areBreadcrumbsActivated() ? 42 : 0;
    const h =
      parent.clientHeight - // Maximum height of parent element
      16 - // Reduce height with top margin
      16 - // Reduce height with bottom margin
      62 - // Reduce with space for Search bar
      spaceForBreadcrumbs; // If Breadcrumbs are active, make space for them as well
    return h;
  }

  updatePosition() {
    const { width, height, position } = this.props;
    const parent = this.rnd.getSelfElement().parentElement;

    //FIXME: JW - Not the best solution for parent resize to set top/left to 0/0, but it ensures we don't get a window outside of the parent
    this.left = 16; // Make sure we respect padding
    this.top = 16 + 62; // Respect top padding + don't overlap Drawer Toggle buttons
    this.width = width || 400;
    this.height = height || 300;

    // If "auto" height is set, it means we want the Window to take up maximum space available
    if (this.props.height !== "dynamic" && this.height === "auto") {
      this.height = this.getMaxWindowHeight();
    }

    // If Window renders on the right, there are some things that we need to compensate for
    if (position === "right") {
      this.left = parent.getBoundingClientRect().width - width - 16 - 56; // -16 to take care of usual right padding, -56 to not cover the Control buttons that are on the right
    }

    // Mobile screens are another special case: here our Window should take up max space available
    if (getIsMobile()) {
      this.left = 0;
      this.top = 0;
      this.height = window.innerHeight;
      this.width = document.body.clientWidth;
    }

    this.left = this.left !== undefined ? this.left : 16;

    this.setState(
      {
        left: this.left,
        top: this.top,
        width: this.width,
        height: this.height,
        mode: "window",
      },
      () => {
        this.rnd.updatePosition({
          y: Math.round(this.top),
          x: Math.round(this.left),
        });
      }
    );
  }

  close = (e) => {
    const { onClose, globalObserver, title } = this.props;
    this.latestWidth = this.rnd.getSelfElement().clientWidth;
    if (onClose) onClose();

    globalObserver.publish("core.closeWindow", title);
  };

  fit = (target) => {
    this.rnd.updatePosition({
      x: Math.round(target.getBoundingClientRect().left),
      y: Math.round(target.getBoundingClientRect().top),
    });
    this.rnd.setState({
      disableDrag: true,
    });
    this.setState({
      width: target.clientWidth,
      height: target.clientHeight,
      mode: "maximized",
    });
  };

  reset = () => {
    this.rnd.updatePosition({
      y: Math.round(this.top),
      x: Math.round(this.left),
    });
    this.rnd.setState({
      disableDrag: false,
    });
    this.setState({
      width: this.width,
      height: this.height,
      mode: "window",
    });
  };

  enlarge = () => {
    let t = parseFloat(this.top);
    let h = parseFloat(this.height);
    let c = this.rnd.getSelfElement().parentElement.getBoundingClientRect();
    let o = t + h;

    if (o > c.bottom) {
      this.top = this.top - o + c.bottom;
    }

    this.rnd.updatePosition({
      y: Math.round(this.top),
    });
    this.rnd.setState({
      disableDrag: false,
    });
    this.setState({
      height: this.height,
      mode: "window",
    });
  };

  maximize = () => {
    const {
      globalObserver,
      onMaximize,
      onResize,
      allowMaximizedWindow,
      title,
    } = this.props;

    getIsMobile() && this.rnd.updatePosition({ y: 0 });

    switch (this.state.mode) {
      case "minimized":
        // Enlarge back to "window" mode
        if (this.height === "dynamic") {
          this.height = "auto";
        }
        this.enlarge();
        break;
      case "window":
        // If already in "window" mode, fill the viewport
        allowMaximizedWindow &&
          this.fit(document.getElementById("windows-container"));
        break;
      case "maximized":
        // If already "maximized" mode, switch back to "window"
        this.reset(document.getElementById("windows-container"));
        break;
      default:
        break;
    }

    // Run callbacks
    typeof onMaximize === "function" && onMaximize();
    typeof onResize === "function" && onResize();

    globalObserver.publish("core.maximizeWindow", title);
  };

  minimize = () => {
    const { globalObserver, onMinimize, onResize, title } = this.props;

    getIsMobile() &&
      this.rnd.updatePosition({
        y: Math.round(window.innerHeight - 42),
      });

    // Don't matter the current mode – just collapse
    this.height = this.state.height;
    this.setState({
      height: 0,
      mode: "minimized",
    });

    // Run callbacks
    typeof onMinimize === "function" && onMinimize();
    typeof onResize === "function" && onResize();

    globalObserver.publish("core.minimizeWindow", title);
  };

  bringToFront() {
    document.windows
      .sort((a, b) => (a === this ? 1 : b === this ? -1 : 0))
      .forEach((w, i) => {
        if (w.rnd) {
          w.rnd.getSelfElement().style.zIndex = zIndexStart + i;
        }
      });
  }

  render() {
    const {
      children,
      classes,
      color,
      features,
      open,
      title,
      resizingEnabled,
      draggingEnabled,
      allowMaximizedWindow,
      customPanelHeaderButtons,
      globalObserver,
    } = this.props;
    const { left, top, width, height } = this.state;

    let resizeBottom = true,
      resizeBottomLeft = true,
      resizeBottomRight = true,
      resizeLeft = true,
      resizeRight = true,
      resizeTop = true,
      resizeTopLeft = true,
      resizeTopRight = true;

    if (isMobile) {
      resizeBottom =
        resizeBottomLeft =
        resizeBottomRight =
        resizeRight =
        resizeTopLeft =
        resizeTopRight =
        resizeLeft =
          false;
    } else {
      if (this.state.mode === "maximized") {
        resizeBottom =
          resizeBottomLeft =
          resizeBottomRight =
          resizeRight =
          resizeTop =
          resizeTopLeft =
          resizeTopRight =
          resizeLeft =
            false;
      }
      if (this.state.mode === "minimized") {
        resizeBottom =
          resizeBottomLeft =
          resizeBottomRight =
          resizeTop =
          resizeTopLeft =
          resizeTopRight =
          resizeLeft =
            false;
      }

      if (!resizingEnabled) {
        resizeBottom =
          resizeBottomLeft =
          resizeBottomRight =
          resizeRight =
          resizeTop =
          resizeTopLeft =
          resizeTopRight =
          resizeLeft =
            false;
      }
    }

    this.bringToFront();
    return (
      <Rnd
        onMouseDown={(e) => {
          this.bringToFront();
        }}
        onMouseOver={(e) => e.stopPropagation()} // If this bubbles, we'll have Tooltip show up even when we're only on Window. FIXME: Not needed when we change the rendering order.
        ref={(c) => {
          this.rnd = c;
        }}
        style={{
          display: open ? "block" : "none",
        }}
        onDragStop={(e, d) => {
          const rect = this.rnd.getSelfElement().getClientRects()[0];
          if (rect) {
            this.left = rect.left;
            this.top = rect.top;
            this.right =
              window.innerWidth - (this.left + parseFloat(this.width));
          }
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          this.width = ref.style.width;
          if (this.state.mode !== "minimized") {
            this.height = ref.style.height;
          }
          this.setState({
            width: ref.style.width,
            height: ref.style.height,
          });
          if (this.props.onResize) this.props.onResize();
        }}
        cancel="section,nav"
        bounds={"#windows-container"}
        disableDragging={!draggingEnabled || false || getIsMobile()}
        enableResizing={{
          bottom: resizeBottom,
          bottomLeft: resizeBottomLeft,
          bottomRight: resizeBottomRight,
          left: resizeLeft,
          right: resizeRight,
          top: resizeTop,
          topLeft: resizeTopLeft,
          topRight: resizeTopRight,
        }}
        className={classes.window}
        minWidth={200}
        minHeight={this.state.mode === "minimized" ? 42 : 100}
        size={{
          width: width,
          height: height,
        }}
        default={{
          x: left,
          y: top,
          width: width,
          height: height,
        }}
      >
        <div
          tabIndex="0"
          ref={this.windowRef}
          className={clsx(
            classes.panelContent,
            this.props.height === "dynamic"
              ? classes.panelContentDisplayContents
              : null
          )}
        >
          <PanelHeader
            allowMaximizedWindow={allowMaximizedWindow}
            color={color}
            customHeaderButtons={customPanelHeaderButtons}
            globalObserver={this.props.globalObserver}
            localObserver={this.props.localObserver}
            onClose={this.close}
            onMaximize={this.maximize}
            onMinimize={this.minimize}
            mode={this.state.mode}
            title={title}
          />
          <section
            className={clsx(
              classes.content,
              this.props.scrollable ? null : classes.nonScrollable
            )}
            style={{
              // Ensure to set maxHeight to ensure that we can scroll inside the container
              maxHeight:
                this.getMaxWindowHeight() - (isMobile === false ? 50 : -30), // Super-hack special case for small screens
            }}
          >
            {features && features.length > 0 ? (
              <FeatureInfoContainer
                features={this.props.features}
                options={this.props.options}
                onDisplay={this.props.onDisplay}
                globalObserver={this.props.globalObserver}
                key={
                  Array.isArray(this.props.features) &&
                  this.props.features.length > 0
                    ? this.props.features[0].getId()
                    : 0
                }
              />
            ) : (
              children
            )}
          </section>
        </div>
      </Rnd>
    );
  }
}

export default withStyles(styles)(Window);
