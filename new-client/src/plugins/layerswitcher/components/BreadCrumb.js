import React, { Component } from "react";
import CloseIcon from "@material-ui/icons/Close";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import LaunchIcon from "@material-ui/icons/Launch";
import Button from "@material-ui/core/Button";
import CallMadeIcon from "@material-ui/icons/CallMade";
import { withStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import Popover from "@material-ui/core/Popover";

const styles = theme => ({
  breadCrumbFlat: {
    borderRadius: "0 !important",
    marginBottom: "5px !important"
  },
  breadCrumb: {
    [theme.breakpoints.down("xs")]: {
      background: "white",
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      border: "1px solid #ccc"
    },
    [theme.breakpoints.up("sm")]: {
      background: "white",
      borderTopLeftRadius: "5px",
      borderTopRightRadius: "5px",
      margin: "0px",
      marginLeft: "2px",
      marginRight: "2px",
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      border: "1px solid #ccc",
      whiteSpace: "nowrap"
    }
  },
  part: {
    margin: "0 5px",
    display: "flex"
  },
  icon: {
    cursor: "pointer"
  },
  links: {
    padding: "5px"
  }
});

class BreadCrumb extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: props.layer.getOpacity() === 0,
      anchorEl: null,
      popoverOpen: false
    };
    this.chapters = this.findChapters(
      this.props.layer.get("name"),
      this.props.chapters
    );
  }

  setHidden = e => {
    var o = e.target.getOpacity();
    this.setState({
      hidden: o === 0
    });
  };

  componentDidMount() {
    this.props.layer.on("change:opacity", this.setHidden);
  }

  componentWillUnmount() {
    this.props.layer.un("change:opacity", this.setHidden);
  }

  setLayerOpacity = layer => event => {
    this.setState(
      {
        hidden: !this.state.hidden
      },
      () => {
        layer.setOpacity(this.state.hidden ? 0 : 1);
      }
    );
  };

  setLayerVisibility = layer => event => {
    if (layer.get("visible")) {
      layer.setOpacity(1);
      this.props.app.globalObserver.publish("layerswitcher.hideLayer", layer);
    }
    layer.set("visible", !layer.get("visible"));
  };

  isOverflow(el) {
    if (!el) return false;
    let original = el.scrollLeft++;
    let overflow = el.scrollLeft-- > original;
    return overflow;
  }

  findChapters(id, chapters) {
    if (!chapters) {
      return [];
    }
    return chapters.reduce((chaptersWithLayer, chapter) => {
      if (Array.isArray(chapter.layers)) {
        if (chapter.layers.some(layerId => layerId === id)) {
          chaptersWithLayer = [...chaptersWithLayer, chapter];
        }
        if (chapter.chapters.length > 0) {
          chaptersWithLayer = [
            ...chaptersWithLayer,
            ...this.findChapters(id, chapter.chapters)
          ];
        }
      }
      return chaptersWithLayer;
    }, []);
  }

  renderChapterLinks() {
    const { classes } = this.props;
    if (this.chapters && this.chapters.length > 0) {
      if (this.chapters.length > 0) {
        return (
          <div className={classes.infoTextContainer}>
            <div className={classes.links}>
              {this.chapters.map((chapter, i) => {
                return (
                  <div key={i}>
                    <Button
                      size="small"
                      onClick={() => {
                        this.setState({
                          popoverOpen: false
                        });
                        this.openInformative(chapter);
                      }}
                    >
                      {chapter.header}
                      <CallMadeIcon className={classes.rightIcon} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  openInformative = chapter => {
    const informativeWindow = this.props.app.windows.find(
      window => window.type === "informative"
    );
    informativeWindow.props.custom.open(chapter);
  };

  handleClose = () => {
    this.setState({
      anchorEl: null,
      popoverOpen: false
    });
  };

  renderChaptersPopover(target) {
    this.setState({
      anchorEl: target,
      popoverOpen: true
    });
  }

  renderInformativeIcon() {
    if (!this.props.chapters) {
      return null;
    }
    const { classes } = this.props;
    if (this.chapters && this.chapters.length > 0) {
      if (this.chapters.length === 1) {
        return (
          <div className={classes.part}>
            <LaunchIcon
              className={classes.icon}
              onClick={() => this.openInformative(this.chapters[0])}
            />
          </div>
        );
      } else {
        return (
          <div className={classes.part}>
            <LaunchIcon
              className={classes.icon}
              onClick={e => {
                this.renderChaptersPopover(e.target);
              }}
            />
          </div>
        );
      }
    } else {
      return null;
    }
  }

  render() {
    const { classes } = this.props;
    var { hidden } = this.state;
    var cls =
      this.props.type === "flat"
        ? clsx(classes.breadCrumb, classes.breadCrumbFlat)
        : classes.breadCrumb;
    return (
      <div className={cls} data-type="bread-crumb">
        <div className={classes.part}>
          <div className={classes.part}>
            {!hidden ? (
              <VisibilityIcon
                className={classes.icon}
                onClick={this.setLayerOpacity(this.props.layer)}
              />
            ) : (
              <VisibilityOffIcon
                className={classes.icon}
                onClick={this.setLayerOpacity(this.props.layer)}
              />
            )}
          </div>
          {this.renderInformativeIcon()}
          <div className={classes.part}>{this.props.title}</div>
        </div>
        <div className={classes.part}>
          <CloseIcon
            className={classes.icon}
            onClick={this.setLayerVisibility(this.props.layer)}
          />
        </div>
        <Popover
          id="simple-popper"
          open={this.state.popoverOpen}
          anchorEl={this.state.anchorEl}
          onClose={this.handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center"
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center"
          }}
        >
          {this.renderChapterLinks()}
        </Popover>
      </div>
    );
  }
}

export default withStyles(styles)(BreadCrumb);
